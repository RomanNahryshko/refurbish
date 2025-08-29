import { NextRequest, NextResponse } from 'next/server'
import { DEVICE_STATUS } from '@/lib/constants'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'
import { TestResultData, DeviceStatus } from '@/lib/types/business-types'
import { ProductionMetricsService } from '@/lib/services/production-metrics-service'

export async function POST(request: NextRequest) {
  console.log('🚀 QC API: POST request received')
  
  // Check permission
  const permissionCheck = await requirePermission('qc_checks', 'create')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = await request.text()
    
    // Parse JSON from raw body
    let requestData
    try {
      requestData = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { device_id, check_type, overall_result, grade_assigned, notes, test_results, required_repairs } = requestData



    // Validate required fields
    if (!device_id || !check_type || !overall_result) {
      return NextResponse.json({ 
        error: 'Missing required fields: device_id, check_type, overall_result' 
      }, { status: 400 })
    }

    // Validate check_type
    if (!['initial', 'final'].includes(check_type)) {
      return NextResponse.json({ 
        error: 'Invalid check_type. Must be "initial" or "final"' 
      }, { status: 400 })
    }

    // Validate overall_result
    if (!['not_tested', 'pass', 'fail'].includes(overall_result)) {
      return NextResponse.json({ 
        error: 'Invalid overall_result. Must be "not_tested", "pass", or "fail"' 
      }, { status: 400 })
    }

    // Validate grade_assigned if provided
    if (grade_assigned && !['A', 'B', 'C', 'ungraded'].includes(grade_assigned)) {
      return NextResponse.json({ 
        error: 'Invalid grade_assigned. Must be "A", "B", "C", or "ungraded"' 
      }, { status: 400 })
    }

    // Validate required_repairs if provided
    if (required_repairs && Array.isArray(required_repairs)) {
      const validRepairTypes = ['housing_change', 'glass_change', 'battery_change', 'software_update', 'other']
      
      for (const repairType of required_repairs) {
        if (!validRepairTypes.includes(repairType)) {
          return NextResponse.json({ 
            error: `Invalid repair type: ${repairType}. Must be one of: ${validRepairTypes.join(', ')}` 
          }, { status: 400 })
        }
      }
    }

    // Create QC check
    const { data: qcCheck, error: qcError } = await supabase
      .from('qc_checks')
      .insert({
        device_id,
        check_type,
        overall_result,
        grade_assigned,
        performed_by: user.id,
        performed_at: new Date().toISOString(),
        notes
      })
      .select()
      .single()

    if (qcError) {
      console.error('Error creating QC check:', qcError)
      return NextResponse.json({ 
        error: `Failed to create QC check: ${qcError.message}` 
      }, { status: 500 })
    }

    // Create test results if provided
    if (test_results && Array.isArray(test_results) && test_results.length > 0) {
      const testResultsToInsert = test_results.map((test: TestResultData) => ({
        qc_check_id: qcCheck.id,
        test_name: test.test_name,
        test_result: test.test_result,
        notes: test.notes
      }))

      const { error: testError } = await supabase
        .from('qc_test_results')
        .insert(testResultsToInsert)

      if (testError) {
        console.error('Error creating test results:', testError)
        // Note: We don't fail the entire request if test results fail
        // The QC check was created successfully
      }
    }

    // Update device status based on QC result
    let newDeviceStatus: DeviceStatus = DEVICE_STATUS.received
    if (check_type === 'initial') {
      if (overall_result === 'pass' && grade_assigned) {
        // If initial QC passes with a grade assigned, device is graded
        newDeviceStatus = DEVICE_STATUS.graded
      } else if (overall_result === 'pass') {
        // If initial QC passes without grade, device awaits repair
        newDeviceStatus = DEVICE_STATUS.awaiting_repair
      } else if (overall_result === 'fail') {
        // Failed devices go to repair
        newDeviceStatus = DEVICE_STATUS.awaiting_repair
      }
    } else if (check_type === 'final') {
      if (overall_result === 'pass') {
        newDeviceStatus = DEVICE_STATUS.graded // Passed final QC devices are graded (will be removed from QC queue)
      } else if (overall_result === 'fail') {
        newDeviceStatus = DEVICE_STATUS.awaiting_repair // Failed final QC goes back to repair
      }
    }

    // Update device status
    const { error: deviceUpdateError } = await supabase
      .from('devices')
      .update({ 
        status: newDeviceStatus,
        grade: grade_assigned || 'ungraded',
        updated_at: new Date().toISOString()
      })
      .eq('id', device_id)

    if (deviceUpdateError) {
      console.error('Error updating device status:', deviceUpdateError)
      // Note: We don't fail the entire request if device update fails
    }

        // Update production metrics for required repairs when initial QC fails
    // This ensures repair metrics are updated for devices that need repairs
    if (check_type === 'initial' && overall_result === 'fail' && required_repairs && Array.isArray(required_repairs) && required_repairs.length > 0) {
      try {
        const productionMetricsService = new ProductionMetricsService()
        await productionMetricsService.updateRepairMetrics(required_repairs)
      } catch (metricsError) {
        console.error('Error updating production metrics for required repairs:', metricsError)
        // Don't fail the entire request if metrics update fails
      }
    }

    // Update production metrics for initial grade when initial QC has grade assigned
    // This ensures initial grade metrics are updated regardless of overall result
    if (check_type === 'initial' && grade_assigned && grade_assigned !== 'ungraded') {
      try {
        const productionMetricsService = new ProductionMetricsService()
        await productionMetricsService.updateInitialGradeMetrics(grade_assigned as 'A' | 'B' | 'C')
      } catch (metricsError) {
        console.error('Error updating production metrics for initial grade:', metricsError)
        // Don't fail the entire request if metrics update fails
      }
    }

    // Create repair jobs if initial QC failed and repairs are required
    if (check_type === 'initial' && overall_result === 'fail' && required_repairs && Array.isArray(required_repairs) && required_repairs.length > 0) {
      try {
        // Create repair jobs for each required repair type
        for (const repairType of required_repairs) {
          // Prepare description for 'other' repair type
          let description: string | undefined
          if (repairType === 'other') {
            // Extract repair details from notes
            const repairDetails = notes?.replace('Initial QC: Repairs required. Selected repairs: ', '') || ''
            description = repairDetails || 'Other repair required'
          }

          const { error: repairJobError } = await supabase
            .from('repair_jobs')
            .insert({
              device_id,
              repair_type: repairType,
              status: 'pending',
              created_by: user.id,
              description
            })

          if (repairJobError) {
            console.error(`Error creating repair job for ${repairType}:`, repairJobError)
            // Don't fail the entire request if repair job creation fails
          }
        }
      } catch (error) {
        console.error('Error creating repair jobs:', error)
        // Don't fail the entire request if repair job creation fails
      }
    }

    // Additional logging for devices that pass initial QC with grade but don't need repairs
    if (check_type === 'initial' && overall_result === 'pass' && grade_assigned && grade_assigned !== 'ungraded' && 
        (!required_repairs || !Array.isArray(required_repairs) || required_repairs.length === 0)) {
      console.log('🎯 Device passed initial QC with grade without requiring repairs:', {
        device_id,
        grade: grade_assigned,
        status: 'No repairs needed'
      })
    }

    // Update production metrics for grade assignment if final QC passes with grade
    if (check_type === 'final' && overall_result === 'pass' && grade_assigned && grade_assigned !== 'ungraded') {
      try {
        console.log('🏆 Updating production metrics for final grade assignment:', grade_assigned)
        const productionMetricsService = new ProductionMetricsService()
        await productionMetricsService.updateGradeMetrics(grade_assigned as 'A' | 'B' | 'C')
        console.log('✅ Successfully updated production metrics for final grade assignment')
      } catch (metricsError) {
        console.error('❌ Error updating production metrics for final grade assignment:', metricsError)
        // Don't fail the entire request if metrics update fails
      }
    }

    // Update production metrics for fail QC when final QC fails
    if (check_type === 'final' && overall_result === 'fail') {
      try {
        console.log('❌ Updating production metrics for failed final QC')
        const productionMetricsService = new ProductionMetricsService()
        await productionMetricsService.updateFailQCMetrics()
        console.log('✅ Successfully updated production metrics for failed final QC')
      } catch (metricsError) {
        console.error('❌ Error updating production metrics for failed final QC:', metricsError)
        // Don't fail the entire request if metrics update fails
      }
    }

    // Record device status history with QC notes for all status changes
    const historyNotes = notes || (check_type === 'final' 
      ? overall_result === 'pass' 
        ? `Final QC passed with grade ${grade_assigned}`
        : `Final QC failed - requires additional repairs`
      : `Initial QC: ${overall_result === 'pass' ? 'Passed' : 'Failed'}`
    )

    const { error: historyError } = await supabase
      .from('device_status_history')
      .insert({
        device_id: device_id,
        new_status: newDeviceStatus,
        notes: historyNotes,
        changed_by: user.id,
        created_at: new Date().toISOString()
      })

    if (historyError) {
      console.error('Error recording device status history:', historyError)
      // Note: We don't fail the entire request if history recording fails
    }

    // Count created repair jobs for response
    let repairJobsCreated = 0
    if (check_type === 'initial' && overall_result === 'fail' && required_repairs && Array.isArray(required_repairs)) {
      repairJobsCreated = required_repairs.length
    }

    return NextResponse.json({ 
      data: qcCheck,
      message: 'QC check created successfully',
      repair_jobs_created: repairJobsCreated
    })

  } catch (error) {
    console.error('Error in QC checks POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('qc_checks', 'read')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('device_id')

    if (!deviceId) {
      return NextResponse.json({ 
        error: 'device_id parameter is required' 
      }, { status: 400 })
    }

    // Get QC checks for the device
    const { data: qcChecks, error } = await supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching QC checks:', error)
      return NextResponse.json({ 
        error: `Failed to fetch QC checks: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      data: qcChecks,
      message: 'QC checks fetched successfully' 
    })

  } catch (error) {
    console.error('Error in QC checks GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
