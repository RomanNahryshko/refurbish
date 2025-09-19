import { NextRequest, NextResponse } from 'next/server'
import { DEVICE_STATUS } from '@/lib/constants'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'

export async function POST(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('devices', 'update')
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { device_id, status } = await request.json()

    // Validate required fields
    if (!device_id) {
      return NextResponse.json({ 
        error: 'Missing required field: device_id' 
      }, { status: 400 })
    }

    if (!status) {
      return NextResponse.json({ 
        error: 'Missing required field: status' 
      }, { status: 400 })
    }

    // Validate status value
    const validStatuses = Object.values(DEVICE_STATUS)
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // Get current device status
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, status, internal_id')
      .eq('id', device_id)
      .single()

    if (deviceError) {
      console.error('Error fetching device:', deviceError)
      return NextResponse.json({ 
        error: `Failed to fetch device: ${deviceError.message}` 
      }, { status: 500 })
    }

    if (!device) {
      return NextResponse.json({ 
        error: 'Device not found' 
      }, { status: 404 })
    }

    // Update device status
    const { data: updatedDevice, error: updateError } = await supabase
      .from('devices')
      .update({ 
        status: status,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', device_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating device status:', updateError)
      return NextResponse.json({ 
        error: `Failed to update device status: ${updateError.message}` 
      }, { status: 500 })
    }

    // Record device status change in history
    try {
      const { recordDeviceStatusChange } = await import('@/lib/helpers/device-status-history')
      await recordDeviceStatusChange(supabase, {
        device_id: device_id,
        old_status: device.status,
        new_status: status,
        changed_by: user.id,
        notes: `Device status updated to ${status} after repair job completion`
      })
    } catch (historyError) {
      console.error('Error recording device status history:', historyError)
      // Don't fail the entire request if history recording fails
    }
    
    return NextResponse.json({ 
      data: updatedDevice,
      message: 'Device status updated successfully',
      old_status: device.status,
      new_status: status
    })

  } catch (error) {
    console.error('Error in device status update:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
