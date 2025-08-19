import { NextRequest, NextResponse } from 'next/server'
import { DEVICE_STATUS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'

export async function POST(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('repair_jobs', 'update')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { repair_job_id, completion_notes, parts_used } = await request.json()

    // Validate required fields
    if (!repair_job_id) {
      return NextResponse.json({ 
        error: 'Missing required field: repair_job_id' 
      }, { status: 400 })
    }

    // First, get the repair job to check device_id and current status
    const { data: repairJob, error: fetchError } = await supabase
      .from('repair_jobs')
      .select('device_id, repair_type, status')
      .eq('id', repair_job_id)
      .single()

    if (fetchError) {
      console.error('Error fetching repair job:', fetchError)
      return NextResponse.json({ 
        error: `Failed to fetch repair job: ${fetchError.message}` 
      }, { status: 500 })
    }

    if (!repairJob) {
      return NextResponse.json({ 
        error: 'Repair job not found' 
      }, { status: 404 })
    }

    if (repairJob.status !== 'in_progress') {
      return NextResponse.json({ 
        error: 'Repair job must be in progress to complete' 
      }, { status: 400 })
    }

    // Update the repair job to completed
    const { data: updatedRepairJob, error: updateError } = await supabase
      .from('repair_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_notes: completion_notes || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', repair_job_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating repair job:', updateError)
      return NextResponse.json({ 
        error: `Failed to update repair job: ${updateError.message}` 
      }, { status: 500 })
    }

    // Record parts usage if provided
    if (parts_used && Array.isArray(parts_used) && parts_used.length > 0) {
      const partsToRecord = parts_used.map(part => ({
        repair_job_id,
        spare_part_id: part.spare_part_id,
        quantity_used: part.quantity_used,
        notes: part.notes,
        recorded_by: user.id,
        recorded_at: new Date().toISOString()
      }))

      const { error: partsError } = await supabase
        .from('repair_parts_used')
        .insert(partsToRecord)

      if (partsError) {
        console.error('Error recording parts usage:', partsError)
        // Don't fail the entire request if parts recording fails
      }
    }

    // Check if all repairs for this device are completed
    const { data: pendingRepairs, error: pendingError } = await supabase
      .from('repair_jobs')
      .select('id, status')
      .eq('device_id', repairJob.device_id)
      .in('status', ['pending', 'in_progress'])

    if (pendingError) {
      console.error('Error checking pending repairs:', pendingError)
      // Don't fail the entire request if this check fails
    } else {
      // If all repairs are completed, send device to final QC
      if (!pendingRepairs || pendingRepairs.length === 0) {
        // Update device status to final_qc
        const { error: deviceUpdateError } = await supabase
          .from('devices')
          .update({ 
            status: DEVICE_STATUS.final_qc,
            updated_at: new Date().toISOString()
          })
          .eq('id', repairJob.device_id)

        if (deviceUpdateError) {
          console.error('Error updating device status to final_qc:', deviceUpdateError)
          // Don't fail the entire request if device update fails
        }

        // Create QC check record for final quality control
        const { error: qcCheckError } = await supabase
          .from('qc_checks')
          .insert({
            device_id: repairJob.device_id,
            check_type: 'final',
            overall_result: 'not_tested',
            performed_by: user.id,
            notes: `Device sent to final QC after completing ${repairJob.repair_type} repair`
          })

        if (qcCheckError) {
          console.error('Error creating QC check record:', qcCheckError)
          // Don't fail the entire request if QC check creation fails
        }

        // Record device status change in history
        const { error: historyError } = await supabase
          .from('device_status_history')
          .insert({
            device_id: repairJob.device_id,
            old_status: DEVICE_STATUS.in_repair,
            new_status: DEVICE_STATUS.final_qc,
            changed_by: user.id,
            notes: `Device sent to final QC after completing ${repairJob.repair_type} repair`
          })

        if (historyError) {
          console.error('Error recording device status history:', historyError)
          // Don't fail the entire request if history recording fails
        }
      }
    }

    return NextResponse.json({ 
      data: updatedRepairJob,
      message: 'Repair job completed successfully',
      device_sent_to_qc: !pendingRepairs || pendingRepairs.length === 0
    })

  } catch (error) {
    console.error('Error in repair job completion POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
