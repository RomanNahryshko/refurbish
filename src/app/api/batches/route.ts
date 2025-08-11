import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/services/permissions'

// GET /api/batches - Get all batches
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const hasPermission = await checkPermission(user.id, 'batches', 'read')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplier_id')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('batches')
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Apply filters
    if (supplierId) {
      query = query.eq('supplier_id', supplierId)
    }

    if (search) {
      query = query.or(`batch_number.ilike.%${search}%,invoice_number.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching batches:', error)
      return NextResponse.json(
        { error: 'Failed to fetch batches' },
        { status: 500 }
      )
    }

    // Transform data to include supplier_name
    const batches = data?.map(batch => ({
      ...batch,
      supplier_name: batch.supplier?.name
    })) || []

    return NextResponse.json({ data: batches })
  } catch (error) {
    console.error('Batches API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/batches - Create a new batch
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const hasPermission = await checkPermission(user.id, 'batches', 'create')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      supplier_id,
      invoice_number,
      invoice_date,
      invoice_amount,
      device_count,
      received_date,
      notes
    } = body

    // Validate required fields
    if (!supplier_id || !device_count) {
      return NextResponse.json(
        { error: 'Missing required fields: supplier_id and device_count are required' },
        { status: 400 }
      )
    }

    // Generate batch number (format: BATCH-YYYY-MM-DD-HHMMSS)
    const now = new Date()
    const batchNumber = `BATCH-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

    // Create batch
    const { data, error } = await supabase
      .from('batches')
      .insert({
        batch_number: batchNumber,
        supplier_id,
        invoice_number,
        invoice_date,
        invoice_amount: invoice_amount ? parseFloat(invoice_amount) : null,
        device_count: parseInt(device_count),
        received_date: received_date || new Date().toISOString().split('T')[0],
        notes,
        created_by: user.id
      })
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .single()

    if (error) {
      console.error('Error creating batch:', error)
      return NextResponse.json(
        { error: 'Failed to create batch' },
        { status: 500 }
      )
    }

    // Transform data to include supplier_name
    const batch = {
      ...data,
      supplier_name: data.supplier?.name
    }

    return NextResponse.json({ data: batch }, { status: 201 })
  } catch (error) {
    console.error('Create batch API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

