import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/services/permissions'

// POST /api/qc-checks - Create a new QC check
export async function POST(request: NextRequest) {
  console.log('QC checks API called')
  console.log('Request method:', request.method)
  console.log('Request URL:', request.url)
  console.log('Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    const supabase = await createClient()
    if (!supabase) {
      console.error('Supabase client not initialized')
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    console.log('User authentication check:', { user: user?.id, email: user?.email })
    if (!user) {
      console.error('No authenticated user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    console.log('Checking permission for user:', user.id)
    const hasPermission = await checkPermission(user.id, 'qc_checks', 'create')
    console.log('Permission result:', hasPermission)
    if (!hasPermission) {
      console.error('User does not have permission to create QC checks')
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    console.log('Request body:', body)
    const {
      device_id,
      check_type,
      overall_result,
      grade_assigned,
      notes,
      repair_task_ids
    } = body

    // Validate required fields
    if (!device_id || !check_type || !overall_result) {
      return NextResponse.json(
        { error: 'Missing required fields: device_id, check_type, and overall_result are required' },
        { status: 400 }
      )
    }

    // Validate check_type
    if (!['initial', 'final'].includes(check_type)) {
      return NextResponse.json(
        { error: 'Invalid check_type. Must be one of: initial, final' },
        { status: 400 }
      )
    }

    // Validate overall_result
            if (!['not_tested', 'pass', 'fail'].includes(overall_result)) {
          return NextResponse.json(
            { error: 'Invalid overall_result. Must be one of: not_tested, pass, fail' },
        { status: 400 }
      )
    }

    // Validate grade_assigned if provided
    if (grade_assigned && !['A', 'B', 'C'].includes(grade_assigned)) {
      return NextResponse.json(
        { error: 'Invalid grade_assigned. Must be one of: A, B, C' },
        { status: 400 }
      )
    }

    // Check if device exists
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id')
      .eq('id', device_id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    // Create QC check
    const { data: qcCheck, error: qcError } = await supabase
      .from('qc_checks')
      .insert({
        device_id,
        check_type,
        overall_result,
        grade_assigned,
        notes,
        performed_by: user.id,
        performed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (qcError) {
      console.error('Error creating QC check:', qcError)
      return NextResponse.json(
        { error: 'Failed to create QC check' },
        { status: 500 }
      )
    }

    // If repair tasks are provided, create QC repair task records
    if (repair_task_ids && repair_task_ids.length > 0) {
      const repairTaskRecords = repair_task_ids.map((repair_task_id: string) => ({
        qc_check_id: qcCheck.id,
        repair_task_id
      }))

      const { error: repairError } = await supabase
        .from('qc_repair_tasks')
        .insert(repairTaskRecords)

      if (repairError) {
        console.error('Error creating QC repair tasks:', repairError)
        // Don't fail the entire request, just log the error
        console.warn('QC check created but repair tasks failed to save')
      }
    }

    // Return the created QC check
    return NextResponse.json({ data: qcCheck }, { status: 201 })
  } catch (error) {
    console.error('Create QC check API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
