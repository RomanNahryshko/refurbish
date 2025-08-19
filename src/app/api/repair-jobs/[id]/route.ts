import { NextRequest, NextResponse } from 'next/server'
import { DEVICE_STATUS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  console.log('🔧 PATCH /api/repair-jobs/[id] called with params:', resolvedParams)
  
  // Check permission
  const permissionCheck = await requirePermission('repair_jobs', 'update')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = resolvedParams
    const updateData = await request.json()
    
    console.log('🔧 Update data received:', updateData)

    // Validate the repair job exists
    const { data: existingRepairJob, error: fetchError } = await supabase
      .from('repair_jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingRepairJob) {
      return NextResponse.json({ 
        error: 'Repair job not found' 
      }, { status: 404 })
    }

    // Update the repair job
    const { data: updatedRepairJob, error: updateError } = await supabase
      .from('repair_jobs')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating repair job:', updateError)
      return NextResponse.json({ 
        error: `Failed to update repair job: ${updateError.message}` 
      }, { status: 500 })
    }
    
    console.log('🔧 Repair job updated successfully:', updatedRepairJob)

    // Handle device status changes based on repair job status
    if (updateData.status === 'in_progress') {
      const { error: deviceUpdateError } = await supabase
        .from('devices')
        .update({ 
          status: DEVICE_STATUS.in_repair,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRepairJob.device_id)

      if (deviceUpdateError) {
        console.error('Error updating device status to in_repair:', deviceUpdateError)
        // Don't fail the entire request if device update fails
      }

      // Record device status change in history
      const { error: historyError } = await supabase
        .from('device_status_history')
        .insert({
          device_id: existingRepairJob.device_id,
          old_status: DEVICE_STATUS.awaiting_repair,
          new_status: DEVICE_STATUS.in_repair,
          changed_by: user.id,
          notes: `Device status changed to in_repair when starting repair job`
        })

      if (historyError) {
        console.error('Error recording device status history:', historyError)
        // Don't fail the entire request if history recording fails
      }
    } else if (updateData.status === 'pending') {
      // If status is being changed back to pending, update device status to awaiting_repair
      const { error: deviceUpdateError } = await supabase
        .from('devices')
        .update({ 
          status: DEVICE_STATUS.awaiting_repair,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRepairJob.device_id)

      if (deviceUpdateError) {
        console.error('Error updating device status to awaiting_repair:', deviceUpdateError)
        // Don't fail the entire request if device update fails
      }

      // Record device status change in history
      const { error: historyError } = await supabase
        .from('device_status_history')
        .insert({
          device_id: existingRepairJob.device_id,
          old_status: DEVICE_STATUS.in_repair,
          new_status: DEVICE_STATUS.awaiting_repair,
          changed_by: user.id,
          notes: `Device status changed to awaiting_repair when canceling repair job`
        })

      if (historyError) {
        console.error('Error recording device status history:', historyError)
        // Don't fail the entire request if history recording fails
      }
    }

    console.log('🔧 Returning successful response with data:', updatedRepairJob)
    return NextResponse.json({ 
      data: updatedRepairJob,
      message: 'Repair job updated successfully' 
    })

  } catch (error) {
    console.error('Error in repair job PATCH:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
