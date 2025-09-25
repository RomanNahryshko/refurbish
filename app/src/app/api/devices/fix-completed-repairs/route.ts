import { NextRequest, NextResponse } from 'next/server'
import { DEVICE_STATUS } from '@/lib/constants'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'

export async function POST(request: NextRequest) {
  // Check permission - only admins should be able to run this fix
  const permissionCheck = await requirePermission('devices', 'update')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dry_run = true } = await request.json().catch(() => ({ dry_run: true }))

    console.log(`🔧 Starting device status fix script (dry_run: ${dry_run})`)

    // Step 1: Find devices in 'in_repair' status
    const { data: devicesInRepair, error: devicesError } = await supabase
      .from('devices')
      .select('id, imei, brand, model, status, created_at')
      .eq('status', DEVICE_STATUS.in_repair)
      .is('deleted_at', null)

    if (devicesError) {
      console.error('Error fetching devices in repair:', devicesError)
      return NextResponse.json({ 
        error: `Failed to fetch devices: ${devicesError.message}` 
      }, { status: 500 })
    }

    console.log(`📊 Found ${devicesInRepair?.length || 0} devices in 'in_repair' status`)

    if (!devicesInRepair || devicesInRepair.length === 0) {
      return NextResponse.json({
        message: 'No devices found in in_repair status',
        affected_devices: 0,
        fixed_devices: 0
      })
    }

    const affectedDevices = []
    const results = []

    // Step 2: Check each device for completed repair jobs
    for (const device of devicesInRepair) {
      console.log(`🔍 Checking device ${device.id} (${device.brand} ${device.model})`)

      // Get all repair jobs for this device
      const { data: allRepairJobs, error: repairJobsError } = await supabase
        .from('repair_jobs')
        .select('id, status, repair_type, created_at, completed_at')
        .eq('device_id', device.id)
        .is('deleted_at', null)

      if (repairJobsError) {
        console.error(`Error fetching repair jobs for device ${device.id}:`, repairJobsError)
        results.push({
          device_id: device.id,
          imei: device.imei,
          error: `Failed to fetch repair jobs: ${repairJobsError.message}`
        })
        continue
      }

      if (!allRepairJobs || allRepairJobs.length === 0) {
        console.log(`⚠️ Device ${device.id} has no repair jobs, skipping`)
        continue
      }

      // Check if all repair jobs are completed
      const pendingJobs = allRepairJobs.filter(job => job.status !== 'completed')
      const completedJobs = allRepairJobs.filter(job => job.status === 'completed')

      console.log(`📋 Device ${device.id}: ${completedJobs.length} completed, ${pendingJobs.length} pending repair jobs`)

      if (pendingJobs.length === 0 && completedJobs.length > 0) {
        // This device should be moved to final_qc
        affectedDevices.push({
          device_id: device.id,
          imei: device.imei,
          brand: device.brand,
          model: device.model,
          total_repair_jobs: allRepairJobs.length,
          completed_jobs: completedJobs.length,
          repair_types: completedJobs.map(job => job.repair_type)
        })

        if (!dry_run) {
          // Step 3: Update device status to final_qc
          console.log(`🔄 Updating device ${device.id} status to final_qc`)
          
          const { error: deviceUpdateError } = await supabase
            .from('devices')
            .update({ 
              status: DEVICE_STATUS.final_qc,
              updated_by: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', device.id)

          if (deviceUpdateError) {
            console.error(`Error updating device ${device.id} status:`, deviceUpdateError)
            results.push({
              device_id: device.id,
              imei: device.imei,
              error: `Failed to update device status: ${deviceUpdateError.message}`
            })
            continue
          }

          // Step 4: Create QC check record if it doesn't exist
          const { data: existingQcCheck } = await supabase
            .from('qc_checks')
            .select('id')
            .eq('device_id', device.id)
            .eq('check_type', 'final')
            .single()

          if (!existingQcCheck) {
            console.log(`📝 Creating QC check record for device ${device.id}`)
            
            const { error: qcCheckError } = await supabase
              .from('qc_checks')
              .insert({
                device_id: device.id,
                check_type: 'final',
                overall_result: 'not_tested',
                performed_by: user.id,
                notes: `Device sent to final QC via repair status fix script`
              })

            if (qcCheckError) {
              console.error(`Error creating QC check for device ${device.id}:`, qcCheckError)
            }
          }

          // Step 5: Record device status change in history
          try {
            const { recordDeviceStatusChange } = await import('@/lib/helpers/device-status-history')
            await recordDeviceStatusChange(supabase, {
              device_id: device.id,
              old_status: DEVICE_STATUS.in_repair,
              new_status: DEVICE_STATUS.final_qc,
              changed_by: user.id,
              notes: `Status fixed via repair completion script - all repair jobs were completed`
            })
          } catch (historyError) {
            console.error(`Error recording status history for device ${device.id}:`, historyError)
          }

          results.push({
            device_id: device.id,
            imei: device.imei,
            brand: device.brand,
            model: device.model,
            status: 'fixed',
            repair_jobs_completed: completedJobs.length
          })

          console.log(`✅ Successfully fixed device ${device.id}`)
        } else {
          results.push({
            device_id: device.id,
            imei: device.imei,
            brand: device.brand,
            model: device.model,
            status: 'would_be_fixed',
            repair_jobs_completed: completedJobs.length,
            repair_types: completedJobs.map(job => job.repair_type)
          })
        }
      }
    }

    const summary = {
      total_devices_checked: devicesInRepair.length,
      affected_devices: affectedDevices.length,
      fixed_devices: dry_run ? 0 : results.filter(r => r.status === 'fixed').length,
      dry_run,
      timestamp: new Date().toISOString()
    }

    console.log(`🏁 Device status fix completed:`, summary)

    return NextResponse.json({
      message: dry_run 
        ? `Dry run completed. Found ${affectedDevices.length} devices that need status fix.`
        : `Fix completed. Updated ${summary.fixed_devices} devices.`,
      summary,
      affected_devices: affectedDevices,
      results: dry_run ? results : results.filter(r => r.error || r.status === 'fixed')
    })

  } catch (error) {
    console.error('Error in device status fix script:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

