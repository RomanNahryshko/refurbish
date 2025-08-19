import { NextRequest, NextResponse } from 'next/server'
import { DEVICE_STATUS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'

export async function POST(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('repair_jobs', 'create')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { device_id, repair_type, description, assigned_to } = await request.json()

    // Validate required fields
    if (!device_id || !repair_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: device_id, repair_type' 
      }, { status: 400 })
    }

    // Validate repair_type
    if (!['housing_change', 'glass_change', 'battery_change', 'software_update', 'other'].includes(repair_type)) {
      return NextResponse.json({ 
        error: 'Invalid repair_type' 
      }, { status: 400 })
    }

    // Validate description for 'other' type
    if (repair_type === 'other' && !description) {
      return NextResponse.json({ 
        error: 'Description is required for "other" repair type' 
      }, { status: 400 })
    }

    // Check if device exists
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, status')
      .eq('id', device_id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ 
        error: 'Device not found' 
      }, { status: 404 })
    }

    // Create repair job
    const { data: repairJob, error: repairError } = await supabase
      .from('repair_jobs')
      .insert({
        device_id,
        repair_type,
        description,
        assigned_to,
        status: 'pending',
        created_by: user.id,
        assigned_at: assigned_to ? new Date().toISOString() : undefined
      })
      .select()
      .single()

    if (repairError) {
      console.error('Error creating repair job:', repairError)
      return NextResponse.json({ 
        error: `Failed to create repair job: ${repairError.message}` 
      }, { status: 500 })
    }

    // Update device status to 'in_repair' if not already
    if (device.status !== DEVICE_STATUS.in_repair) {
      const { error: deviceUpdateError } = await supabase
        .from('devices')
        .update({ 
          status: DEVICE_STATUS.in_repair,
          updated_at: new Date().toISOString()
        })
        .eq('id', device_id)

      if (deviceUpdateError) {
        console.error('Error updating device status:', deviceUpdateError)
        // Note: We don't fail the entire request if device update fails
      }
    }

    return NextResponse.json({ 
      data: repairJob,
      message: 'Repair job created successfully' 
    })

  } catch (error) {
    console.error('Error in repair jobs POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('repair_jobs', 'read')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('device_id')
    const technicianId = searchParams.get('technician_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('repair_jobs')
      .select(`
        *,
        device:devices(internal_id, imei, brand, model),
        assigned_user:user_profiles(full_name, technician_level)
      `)
      .is('deleted_at', null)

    // Apply filters
    if (deviceId) {
      query = query.eq('device_id', deviceId)
    }
    if (technicianId) {
      query = query.eq('assigned_to', technicianId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: repairJobs, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching repair jobs:', error)
      return NextResponse.json({ 
        error: `Failed to fetch repair jobs: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      data: repairJobs,
      message: 'Repair jobs fetched successfully' 
    })

  } catch (error) {
    console.error('Error in repair jobs GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
