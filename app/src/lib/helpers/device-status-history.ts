import { SupabaseClient } from '@supabase/supabase-js'
import { DeviceStatus } from '@/lib/types/business-types'

interface DeviceStatusHistoryData {
  device_id: string
  old_status?: DeviceStatus
  new_status: DeviceStatus
  changed_by: string
  notes?: string
}

/**
 * Helper function to record device status changes with full user information
 * This ensures that every status change is properly tracked with user details
 */
export async function recordDeviceStatusChange(
  supabase: SupabaseClient,
  data: DeviceStatusHistoryData
) {
  try {
    // Don't record history if status hasn't actually changed
    // Check both when old_status is provided and when it matches new_status
    if (data.old_status && data.old_status === data.new_status) {
      console.log('⏭️ Skipping status history - status unchanged:', {
        device_id: data.device_id,
        status: data.new_status
      })
      return { success: true, skipped: true }
    }
    
    // If old_status is not provided, fetch current device status to check if it's the same
    if (!data.old_status) {
      const { data: currentDevice } = await supabase
        .from('devices')
        .select('status')
        .eq('id', data.device_id)
        .single()
      
      if (currentDevice && currentDevice.status === data.new_status) {
        console.log('⏭️ Skipping status history - status unchanged (checked from DB):', {
          device_id: data.device_id,
          status: data.new_status
        })
        return { success: true, skipped: true }
      }
    }

    // Get user profile information
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('id', data.changed_by)
      .single()

    if (profileError) {
      console.warn('Could not fetch user profile for status history:', profileError.message)
    }

    // Prepare history record with user information
    const historyRecord = {
      device_id: data.device_id,
      old_status: data.old_status,
      new_status: data.new_status,
      changed_by: data.changed_by,
      notes: data.notes || `Status changed from ${data.old_status || 'unknown'} to ${data.new_status}`,
      created_at: new Date().toISOString()
    }

    // Insert the history record
    const { error: historyError } = await supabase
      .from('device_status_history')
      .insert(historyRecord)

    if (historyError) {
      console.error('Error recording device status history:', historyError)
      throw new Error(`Failed to record device status history: ${historyError.message}`)
    }

    console.log('✅ Device status history recorded:', {
      device_id: data.device_id,
      status_change: `${data.old_status || 'unknown'} → ${data.new_status}`,
      changed_by: userProfile ? `${userProfile.full_name} (${userProfile.email || 'No email'})` : data.changed_by,
      notes: data.notes
    })

    return { success: true, userProfile }
  } catch (error) {
    console.error('Error in recordDeviceStatusChange:', error)
    throw error
  }
}

/**
 * Helper function to update device status and record history in one transaction
 */
export async function updateDeviceStatusWithHistory(
  supabase: SupabaseClient,
  deviceId: string,
  newStatus: DeviceStatus,
  changedBy: string,
  options: {
    oldStatus?: DeviceStatus
    notes?: string
    grade?: string
  } = {}
) {
  try {
    // Update device status
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (options.grade) {
      updateData.grade = options.grade
    }

    const { data: updatedDevice, error: updateError } = await supabase
      .from('devices')
      .update(updateData)
      .eq('id', deviceId)
      .select('*')
      .single()

    if (updateError) {
      throw new Error(`Failed to update device status: ${updateError.message}`)
    }

    // Record the status change in history
    await recordDeviceStatusChange(supabase, {
      device_id: deviceId,
      old_status: options.oldStatus,
      new_status: newStatus,
      changed_by: changedBy,
      notes: options.notes
    })

    return updatedDevice
  } catch (error) {
    console.error('Error in updateDeviceStatusWithHistory:', error)
    throw error
  }
}
