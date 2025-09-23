import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/services/permissions'

// GET /api/batches - Get all batches
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
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
    const supabase = await createSupabaseServerClient()
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

    // Create batch
    const { data, error } = await supabase
      .from('batches')
      .insert({
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

    // Update production_metrics for the current date
    const today = new Date().toISOString().split('T')[0]
    
    // First, try to get existing metrics for today
    const { data: existingMetrics, error: selectError } = await supabase
      .from('production_metrics')
      .select('devices_received, batches_created')
      .eq('metric_date', today)
      .single()
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error selecting existing metrics:', selectError)
    }
    
    
    // Calculate new values
    const currentDevicesReceived = existingMetrics?.devices_received || 0
    const newDevicesReceived = currentDevicesReceived + parseInt(device_count)
    const currentBatchesCreated = existingMetrics?.batches_created || 0
    const newBatchesCreated = currentBatchesCreated + 1
    
    // Try to upsert production_metrics for today
    const { error: metricsError } = await supabase
      .from('production_metrics')
      .upsert({
        metric_date: today,
        devices_received: newDevicesReceived,
        batches_created: newBatchesCreated,
      }, {
        onConflict: 'metric_date',
        ignoreDuplicates: false
      })

    if (metricsError) {
      console.error('❌ Error details:', {
        code: metricsError.code,
        message: metricsError.message,
        details: metricsError.details,
        hint: metricsError.hint
      })
    } else {
      console.log('✅ Successfully updated production_metrics')
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

// PUT /api/batches - Update a batch
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
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
    const hasPermission = await checkPermission(user.id, 'batches', 'update')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    // Process numeric fields
    if (updates.invoice_amount) {
      updates.invoice_amount = parseFloat(updates.invoice_amount)
    }
    if (updates.device_count) {
      updates.device_count = parseInt(updates.device_count)
    }

    // Update batch
    const { data, error } = await supabase
      .from('batches')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .single()

    if (error) {
      console.error('Error updating batch:', error)
      return NextResponse.json(
        { error: 'Failed to update batch' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    // Transform data to include supplier_name
    const batch = {
      ...data,
      supplier_name: data.supplier?.name
    }

    return NextResponse.json({ data: batch })
  } catch (error) {
    console.error('Update batch API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/batches - Delete a batch (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
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
    const hasPermission = await checkPermission(user.id, 'batches', 'delete')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      )
    }

    // Soft delete batch
    const { data, error } = await supabase
      .from('batches')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Error deleting batch:', error)
      return NextResponse.json(
        { error: 'Failed to delete batch' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Batch deleted successfully' })
  } catch (error) {
    console.error('Delete batch API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

