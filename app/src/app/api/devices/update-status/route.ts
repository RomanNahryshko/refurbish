import { NextRequest, NextResponse } from 'next/server'
import { DEVICE_STATUS } from '@/lib/constants'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'

export async function POST(request: NextRequest) {
  console.log('🔄 [DEVICE_UPDATE] Starting device status update process')
  
  // Check permission
  const permissionCheck = await requirePermission('devices', 'update')
  if (permissionCheck) {
    console.log('❌ [DEVICE_UPDATE] Permission check failed:', permissionCheck)
    return permissionCheck
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ [DEVICE_UPDATE] No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ [DEVICE_UPDATE] User authenticated:', { userId: user.id, email: user.email })

    const { device_id, status } = await request.json()
    console.log('📝 [DEVICE_UPDATE] Request data:', { device_id, status })

    // Validate required fields
    if (!device_id) {
      console.log('❌ [DEVICE_UPDATE] Missing device_id')
      return NextResponse.json({ 
        error: 'Missing required field: device_id' 
      }, { status: 400 })
    }

    if (!status) {
      console.log('❌ [DEVICE_UPDATE] Missing status')
      return NextResponse.json({ 
        error: 'Missing required field: status' 
      }, { status: 400 })
    }

    // Validate status value
    const validStatuses = Object.values(DEVICE_STATUS)
    if (!validStatuses.includes(status)) {
      console.log('❌ [DEVICE_UPDATE] Invalid status:', status)
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // Get current device status
    console.log('🔍 [DEVICE_UPDATE] Fetching current device status for:', device_id)
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, status, internal_id')
      .eq('id', device_id)
      .single()

    if (deviceError) {
      console.error('❌ [DEVICE_UPDATE] Error fetching device:', deviceError)
      return NextResponse.json({ 
        error: `Failed to fetch device: ${deviceError.message}` 
      }, { status: 500 })
    }

    if (!device) {
      console.log('❌ [DEVICE_UPDATE] Device not found:', device_id)
      return NextResponse.json({ 
        error: 'Device not found' 
      }, { status: 404 })
    }

    console.log('✅ [DEVICE_UPDATE] Device found:', { 
      id: device.id, 
      internal_id: device.internal_id, 
      current_status: device.status 
    })

    // Update device status
    console.log(`🔄 [DEVICE_UPDATE] Updating device ${device_id} status from ${device.status} to ${status}`)
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
      console.error('❌ [DEVICE_UPDATE] Error updating device status:', updateError)
      return NextResponse.json({ 
        error: `Failed to update device status: ${updateError.message}` 
      }, { status: 500 })
    }

    console.log('✅ [DEVICE_UPDATE] Device status updated successfully:', {
      id: updatedDevice.id,
      internal_id: updatedDevice.internal_id,
      old_status: device.status,
      new_status: updatedDevice.status
    })

    // Record device status change in history
    console.log('📝 [DEVICE_UPDATE] Recording device status change history')
    try {
      const { recordDeviceStatusChange } = await import('@/lib/helpers/device-status-history')
      await recordDeviceStatusChange(supabase, {
        device_id: device_id,
        old_status: device.status,
        new_status: status,
        changed_by: user.id,
        notes: `Device status updated to ${status} after repair job completion`
      })
      console.log('✅ [DEVICE_UPDATE] Device status history recorded successfully')
    } catch (historyError) {
      console.error('❌ [DEVICE_UPDATE] Error recording device status history:', historyError)
      // Don't fail the entire request if history recording fails
    }

    console.log('🏁 [DEVICE_UPDATE] Device status update completed successfully')
    
    return NextResponse.json({ 
      data: updatedDevice,
      message: 'Device status updated successfully',
      old_status: device.status,
      new_status: status
    })

  } catch (error) {
    console.error('💥 [DEVICE_UPDATE] Unexpected error in device status update:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
