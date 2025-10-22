import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'
import { DEVICE_STATUS, REPAIR_STATUS } from '@/lib/constants'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/devices/[id]/faults
 * Get current repair jobs (faults) for a device
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  // Check permission - need repair_jobs:read
  const permissionCheck = await requirePermission('repair_jobs', 'read')
  if (permissionCheck) return permissionCheck

  try {
    const { id: deviceId } = await params
    const supabase = await createSupabaseServerClient()

    // Fetch device with repair jobs
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, internal_id, status')
      .eq('id', deviceId)
      .single()

    if (deviceError || !device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    // Fetch repair jobs for this device (not deleted)
    const { data: repairJobs, error: repairJobsError } = await supabase
      .from('repair_jobs')
      .select('id, repair_type, description, status, created_at')
      .eq('device_id', deviceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (repairJobsError) {
      console.error('Error fetching repair jobs:', repairJobsError)
      return NextResponse.json(
        { error: 'Failed to fetch repair jobs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        device,
        repairJobs: repairJobs || []
      }
    })
  } catch (error) {
    console.error('Error in GET /api/devices/[id]/faults:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/devices/[id]/faults
 * Edit faults (add/remove repair jobs) for a device
 * Only accessible by Super Admin, General Manager, Operations Manager
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  // Check permissions - need both repair_jobs:create and repair_jobs:update
  const createPermCheck = await requirePermission('repair_jobs', 'create')
  if (createPermCheck) return createPermCheck

  const updatePermCheck = await requirePermission('repair_jobs', 'update')
  if (updatePermCheck) return updatePermCheck

  try {
    const { id: deviceId } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { 
      faultsToAdd, 
      faultsToRemove 
    }: { 
      faultsToAdd: Array<{ repair_type: string; description?: string }>
      faultsToRemove: string[] // repair job IDs
    } = body

    // Validate input
    if (!faultsToAdd && !faultsToRemove) {
      return NextResponse.json(
        { error: 'No changes specified' },
        { status: 400 }
      )
    }

    // Fetch device
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, internal_id, status')
      .eq('id', deviceId)
      .single()

    if (deviceError || !device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    // Fetch existing repair jobs
    const { data: existingJobs, error: existingJobsError } = await supabase
      .from('repair_jobs')
      .select('id, repair_type, status')
      .eq('device_id', deviceId)
      .is('deleted_at', null)

    if (existingJobsError) {
      console.error('Error fetching existing jobs:', existingJobsError)
      return NextResponse.json(
        { error: 'Failed to fetch existing repair jobs' },
        { status: 500 }
      )
    }

    const results = {
      added: [] as string[],
      removed: [] as string[],
      errors: [] as string[],
      deviceStatusChanged: false
    }

    // Process faults to add
    if (faultsToAdd && faultsToAdd.length > 0) {
      for (const fault of faultsToAdd) {
        const { repair_type, description } = fault

        // Validate repair type
        if (!['housing_change', 'glass_change', 'battery_change', 'software_update', 'other'].includes(repair_type)) {
          results.errors.push(`Invalid repair type: ${repair_type}`)
          continue
        }

        // Validate description for 'other' type
        if (repair_type === 'other' && !description) {
          results.errors.push('Description is required for "other" repair type')
          continue
        }

        // Check for duplicate - if job of same type exists and is pending/in_progress
        const duplicate = existingJobs?.find(
          job => job.repair_type === repair_type && 
                 (job.status === REPAIR_STATUS.pending || job.status === REPAIR_STATUS.in_progress)
        )

        if (duplicate) {
          results.errors.push(
            `A ${repair_type} repair job already exists for this device (status: ${duplicate.status})`
          )
          continue
        }

        // Create new repair job (pending, not assigned)
        const { error: createError } = await supabase
          .from('repair_jobs')
          .insert({
            device_id: deviceId,
            repair_type,
            description: description || null,
            status: REPAIR_STATUS.pending,
            created_by: user.id,
            assigned_to: null,
            assigned_at: null
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating repair job:', createError)
          results.errors.push(`Failed to create ${repair_type} repair job`)
        } else {
          results.added.push(repair_type)
        }
      }
    }

    // Process faults to remove
    if (faultsToRemove && faultsToRemove.length > 0) {
      for (const jobId of faultsToRemove) {
        const job = existingJobs?.find(j => j.id === jobId)
        
        if (!job) {
          results.errors.push(`Repair job not found: ${jobId}`)
          continue
        }

        // Don't allow removing completed jobs
        if (job.status === REPAIR_STATUS.completed) {
          results.errors.push(`Cannot remove completed repair job: ${job.repair_type}`)
          continue
        }

        // For in_progress jobs, we'll allow removal (confirmation handled by UI)
        // Remove job by setting deleted_at (soft delete)
        const { error: deleteError } = await supabase
          .from('repair_jobs')
          .update({ 
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId)

        if (deleteError) {
          console.error('Error removing repair job:', deleteError)
          results.errors.push(`Failed to remove ${job.repair_type} repair job`)
        } else {
          results.removed.push(job.repair_type)
        }
      }
    }

    // Update device status if needed
    // If new jobs were added and device is in final_qc or graded, move to awaiting_repair
    if (results.added.length > 0 && 
        (device.status === DEVICE_STATUS.final_qc || device.status === DEVICE_STATUS.graded)) {
      
      const { error: statusUpdateError } = await supabase
        .from('devices')
        .update({ 
          status: DEVICE_STATUS.awaiting_repair,
          updated_at: new Date().toISOString()
        })
        .eq('id', deviceId)

      if (statusUpdateError) {
        console.error('Error updating device status:', statusUpdateError)
        results.errors.push('Failed to update device status')
      } else {
        results.deviceStatusChanged = true
      }
    }

    // Build response message
    let message = 'Faults updated successfully'
    if (results.added.length > 0) {
      message += `. Added: ${results.added.join(', ')}`
    }
    if (results.removed.length > 0) {
      message += `. Removed: ${results.removed.join(', ')}`
    }
    if (results.deviceStatusChanged) {
      message += '. Device status changed to awaiting_repair'
    }

    return NextResponse.json({
      data: results,
      message,
      success: true
    })
  } catch (error) {
    console.error('Error in POST /api/devices/[id]/faults:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

