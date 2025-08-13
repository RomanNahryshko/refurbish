import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'

export async function POST(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('repair_parts_used', 'create')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { repair_job_id, spare_part_id, quantity_used, notes } = await request.json()

    // Validate required fields
    if (!repair_job_id || !spare_part_id || !quantity_used) {
      return NextResponse.json({ 
        error: 'Missing required fields: repair_job_id, spare_part_id, quantity_used' 
      }, { status: 400 })
    }

    // Validate quantity
    if (quantity_used <= 0) {
      return NextResponse.json({ 
        error: 'Quantity must be greater than 0' 
      }, { status: 400 })
    }

    // Check if repair job exists
    const { data: repairJob, error: repairJobError } = await supabase
      .from('repair_jobs')
      .select('id, status')
      .eq('id', repair_job_id)
      .is('deleted_at', null)
      .single()

    if (repairJobError || !repairJob) {
      return NextResponse.json({ 
        error: 'Repair job not found' 
      }, { status: 404 })
    }

    // Check if spare part exists and has sufficient stock
    const { data: sparePart, error: sparePartError } = await supabase
      .from('spare_parts')
      .select('id, quantity_in_stock, minimum_stock_level')
      .eq('id', spare_part_id)
      .is('deleted_at', null)
      .single()

    if (sparePartError || !sparePart) {
      return NextResponse.json({ 
        error: 'Spare part not found' 
      }, { status: 404 })
    }

    if (sparePart.quantity_in_stock < quantity_used) {
      return NextResponse.json({ 
        error: `Insufficient stock. Available: ${sparePart.quantity_in_stock}, Requested: ${quantity_used}` 
      }, { status: 400 })
    }

    // Create repair parts usage record
    const { data: partsUsed, error: partsError } = await supabase
      .from('repair_parts_used')
      .insert({
        repair_job_id,
        spare_part_id,
        quantity_used,
        notes,
        recorded_by: user.id,
        recorded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (partsError) {
      console.error('Error creating repair parts usage record:', partsError)
      return NextResponse.json({ 
        error: `Failed to create parts usage record: ${partsError.message}` 
      }, { status: 500 })
    }

    // Note: Stock level update is handled by database trigger

    return NextResponse.json({ 
      data: partsUsed,
      message: 'Parts usage recorded successfully' 
    })

  } catch (error) {
    console.error('Error in repair parts POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('repair_parts_used', 'read')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const repairJobId = searchParams.get('repair_job_id')
    const sparePartId = searchParams.get('spare_part_id')

    if (!repairJobId && !sparePartId) {
      return NextResponse.json({ 
        error: 'Either repair_job_id or spare_part_id parameter is required' 
      }, { status: 400 })
    }

    let query = supabase
      .from('repair_parts_used')
      .select(`
        *,
        repair_job:repair_jobs(id, device_id),
        spare_part:spare_parts(name, sku)
      `)

    // Apply filters
    if (repairJobId) {
      query = query.eq('repair_job_id', repairJobId)
    }
    if (sparePartId) {
      query = query.eq('spare_part_id', sparePartId)
    }

    const { data: partsUsed, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching repair parts usage:', error)
      return NextResponse.json({ 
        error: `Failed to fetch parts usage: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      data: partsUsed,
      message: 'Parts usage fetched successfully' 
    })

  } catch (error) {
    console.error('Error in repair parts GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
