import { NextRequest, NextResponse } from 'next/server'
import { DEVICE_STATUS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'
import { TestResultData, DeviceStatus } from '@/lib/types/business-types'

export async function POST(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('qc_checks', 'create')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { device_id, check_type, overall_result, grade_assigned, notes, test_results } = await request.json()

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
        newDeviceStatus = DEVICE_STATUS.ready_to_ship // Passed final QC devices are ready to ship (will be removed from QC queue)
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

    return NextResponse.json({ 
      data: qcCheck,
      message: 'QC check created successfully' 
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
    const supabase = await createClient()
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
