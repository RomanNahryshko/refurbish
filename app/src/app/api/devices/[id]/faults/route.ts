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
 * Fetch current repair jobs (faults) for a device
 * 
 * @returns Device info and list of repair jobs (excluding soft-deleted)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const permissionCheck = await requirePermission('repair_jobs', 'read')
  if (permissionCheck) return permissionCheck

  try {
    const { id: deviceId } = await params
    const supabase = await createSupabaseServerClient()

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

    // Fetch all active (non-deleted) repair jobs for this device
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
 * Add or remove repair jobs (faults) for a device
 * 
 * Permissions: Only Super Admin, General Manager, Operations Manager
 * 
 * Business logic:
 * - Creates new pending repair jobs for added faults
 * - Soft-deletes removed jobs (pending/in-progress only)
 * - Updates device status based on changes:
 *   - All jobs removed → final_qc
 *   - New jobs added from final_qc/graded → awaiting_repair
 * - Records all changes in device history
 * 
 * @param faultsToAdd - Array of faults to add with optional descriptions
 * @param faultsToRemove - Array of repair job IDs to remove
 * @returns Success message with summary of changes
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
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

    const body = await request.json()
    const { 
      faultsToAdd, 
      faultsToRemove 
    }: { 
      faultsToAdd: Array<{ repair_type: string; description?: string }>
      faultsToRemove: string[]
    } = body

    if (!faultsToAdd && !faultsToRemove) {
      return NextResponse.json(
        { error: 'No changes specified' },
        { status: 400 }
      )
    }

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

    // Fetch all active repair jobs for duplicate checking and removal validation
    const { data: existingJobs, error: existingJobsError } = await supabase
      .from('repair_jobs')
      .select('id, repair_type, status, description')
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
      updated: [] as string[],
      errors: [] as string[],
      deviceStatusChanged: false
    }

    /**
     * Process faults to add
     * - Validates repair type and description
     * - Checks for duplicates (pending/in_progress jobs of same type)
     * - Updates description if 'other' job exists
     * - Creates new pending repair jobs
     */
    if (faultsToAdd && faultsToAdd.length > 0) {
      for (const fault of faultsToAdd) {
        const { repair_type, description } = fault

        // Validate repair type against allowed values
        if (!['housing_change', 'glass_change', 'battery_change', 'software_update', 'other'].includes(repair_type)) {
          results.errors.push(`Invalid repair type: ${repair_type}`)
          continue
        }

        // 'Other' repair type requires a description
        if (repair_type === 'other' && !description) {
          results.errors.push('Description is required for "other" repair type')
          continue
        }

        // Check for duplicate: existing job of same type that's active
        const existingJob = existingJobs?.find(
          job => job.repair_type === repair_type && 
                 (job.status === REPAIR_STATUS.pending || job.status === REPAIR_STATUS.in_progress)
        )

        // If job exists, handle description update for 'other' type or report duplicate
        if (existingJob) {
          const jobDescription = (existingJob as any).description
          
          // Special case: update description for 'other' type if changed
          if (repair_type === 'other' && jobDescription !== description) {
            const { error: updateError } = await supabase
              .from('repair_jobs')
              .update({ 
                description: description || null,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingJob.id)

            if (updateError) {
              console.error('Error updating repair job description:', updateError)
              results.errors.push(`Failed to update ${repair_type} description`)
            } else {
              results.updated.push(repair_type)
              
              // Record description update in history
              try {
                const { recordDeviceStatusChange } = await import('@/lib/helpers/device-status-history')
                await recordDeviceStatusChange(supabase, {
                  device_id: deviceId,
                  old_status: device.status,
                  new_status: device.status,
                  changed_by: user.id,
                  notes: `Repair job description updated for ${repair_type}: "${description}"`
                }, { forceRecord: true })
              } catch (historyError) {
                console.error('Error recording repair job update in history:', historyError)
              }
            }
          } else {
            // Duplicate job detected
            results.errors.push(
              `A ${repair_type} repair job already exists for this device (status: ${existingJob.status})`
            )
          }
          continue
        }

        // Create new pending repair job (not auto-assigned to technician)
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
          
          // Record new job creation in device history
          try {
            const { recordDeviceStatusChange } = await import('@/lib/helpers/device-status-history')
            await recordDeviceStatusChange(supabase, {
              device_id: deviceId,
              old_status: device.status,
              new_status: device.status,
              changed_by: user.id,
              notes: `New repair job added: ${repair_type}${description ? ` - ${description}` : ''}`
            }, { forceRecord: true })
          } catch (historyError) {
            console.error('Error recording repair job addition in history:', historyError)
          }
        }
      }
    }

    /**
     * Process faults to remove
     * - Validates job exists and is not completed
     * - Soft-deletes job by setting deleted_at timestamp
     * - In-progress jobs require UI confirmation (already handled)
     */
    if (faultsToRemove && faultsToRemove.length > 0) {
      for (const jobId of faultsToRemove) {
        const job = existingJobs?.find(j => j.id === jobId)
        
        if (!job) {
          results.errors.push(`Repair job not found: ${jobId}`)
          continue
        }

        // Completed jobs cannot be removed
        if (job.status === REPAIR_STATUS.completed) {
          results.errors.push(`Cannot remove completed repair job: ${job.repair_type}`)
          continue
        }

        // Soft-delete the job (in_progress removal confirmed by UI)
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
          
          // Record job removal in device history
          try {
            const { recordDeviceStatusChange } = await import('@/lib/helpers/device-status-history')
            await recordDeviceStatusChange(supabase, {
              device_id: deviceId,
              old_status: device.status,
              new_status: device.status,
              changed_by: user.id,
              notes: `Repair job removed: ${job.repair_type}${job.status === REPAIR_STATUS.in_progress ? ' (was in progress)' : ''}`
            }, { forceRecord: true })
          } catch (historyError) {
            console.error('Error recording repair job removal in history:', historyError)
          }
        }
      }
    }

    /**
     * Update device status based on changes
     * 
     * Business rules:
     * 1. If ALL jobs removed (no pending/in_progress left) → send to Final QC
     * 2. If new jobs added from final_qc/graded → send back to Awaiting Repair
     */
    
    // Check for remaining active jobs
    const { data: remainingJobs, error: remainingJobsError } = await supabase
      .from('repair_jobs')
      .select('id')
      .eq('device_id', deviceId)
      .is('deleted_at', null)
      .in('status', [REPAIR_STATUS.pending, REPAIR_STATUS.in_progress])

    if (remainingJobsError) {
      console.error('Error checking remaining jobs:', remainingJobsError)
    }

    // Rule 1: All jobs removed → Final QC
    if (!remainingJobsError && remainingJobs && remainingJobs.length === 0 && results.removed.length > 0) {
      const oldStatus = device.status
      const { error: statusUpdateError } = await supabase
        .from('devices')
        .update({ 
          status: DEVICE_STATUS.final_qc,
          updated_at: new Date().toISOString()
        })
        .eq('id', deviceId)

      if (statusUpdateError) {
        console.error('Error updating device status to final_qc:', statusUpdateError)
        results.errors.push('Failed to update device status')
      } else {
        results.deviceStatusChanged = true
        
        try {
          const { recordDeviceStatusChange } = await import('@/lib/helpers/device-status-history')
          await recordDeviceStatusChange(supabase, {
            device_id: deviceId,
            old_status: oldStatus,
            new_status: DEVICE_STATUS.final_qc,
            changed_by: user.id,
            notes: `All repair jobs removed. Device sent to Final QC`
          })
        } catch (historyError) {
          console.error('Error recording device status change in history:', historyError)
        }
      }
    }
    // Rule 2: New jobs added from final_qc/graded → Awaiting Repair
    else if (results.added.length > 0 && 
        (device.status === DEVICE_STATUS.final_qc || device.status === DEVICE_STATUS.graded)) {
      
      const oldStatus = device.status
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
        
        try {
          const { recordDeviceStatusChange } = await import('@/lib/helpers/device-status-history')
          await recordDeviceStatusChange(supabase, {
            device_id: deviceId,
            old_status: oldStatus,
            new_status: DEVICE_STATUS.awaiting_repair,
            changed_by: user.id,
            notes: `Device status changed to awaiting_repair after adding new repair job(s): ${results.added.join(', ')}`
          })
        } catch (historyError) {
          console.error('Error recording device status change in history:', historyError)
        }
      }
    }

    // Build summary response message
    let message = 'Faults updated successfully'
    
    if (results.added.length > 0) {
      message += `. Added: ${results.added.join(', ')}`
    }
    if (results.updated.length > 0) {
      message += `. Updated: ${results.updated.join(', ')}`
    }
    if (results.removed.length > 0) {
      message += `. Removed: ${results.removed.join(', ')}`
    }
    
    if (results.deviceStatusChanged) {
      const { data: updatedDevice } = await supabase
        .from('devices')
        .select('status')
        .eq('id', deviceId)
        .single()
      
      if (updatedDevice) {
        message += `. Device status changed to ${updatedDevice.status}`
      }
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

