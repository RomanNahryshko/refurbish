import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/services/permissions'

// GET /api/batches/[id] - Get a single batch by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Get URL parameters for additional data
    const { searchParams } = new URL(request.url)
    const includeDevices = searchParams.get('include_devices') === 'true'

    // Build query
    let selectQuery = `
      *,
      supplier:suppliers(name)
    `

    if (includeDevices) {
      selectQuery += `, devices(*)`
    }

    const { data, error } = await supabase
      .from('batches')
      .select(selectQuery)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching batch:', error)
      return NextResponse.json(
        { error: 'Failed to fetch batch' },
        { status: 500 }
      )
    }

    // Transform data to include supplier_name
    const batch = {
      ...data,
      supplier_name: data.supplier?.name
    }

    return NextResponse.json({ data: batch })
  } catch (error) {
    console.error('Get batch API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/batches/[id] - Update a batch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const hasPermission = await checkPermission(user.id, 'batches', 'update')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = params

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

    // Update batch
    const { data, error } = await supabase
      .from('batches')
      .update({
        supplier_id,
        invoice_number,
        invoice_date,
        invoice_amount: invoice_amount ? parseFloat(invoice_amount) : null,
        device_count: parseInt(device_count),
        received_date,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        )
      }
      console.error('Error updating batch:', error)
      return NextResponse.json(
        { error: 'Failed to update batch' },
        { status: 500 }
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

// DELETE /api/batches/[id] - Delete a batch (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const hasPermission = await checkPermission(user.id, 'batches', 'delete')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if batch has devices
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('id')
      .eq('batch_id', id)
      .limit(1)

    if (devicesError) {
      console.error('Error checking batch devices:', devicesError)
      return NextResponse.json(
        { error: 'Failed to check batch devices' },
        { status: 500 }
      )
    }

    if (devices && devices.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete batch that contains devices. Please remove all devices first.' },
        { status: 400 }
      )
    }

    // Soft delete batch
    const { error } = await supabase
      .from('batches')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        )
      }
      console.error('Error deleting batch:', error)
      return NextResponse.json(
        { error: 'Failed to delete batch' },
        { status: 500 }
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

