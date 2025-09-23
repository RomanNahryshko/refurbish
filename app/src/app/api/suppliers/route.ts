import { NextRequest, NextResponse } from 'next/server'
import { getAuthorizedClient } from '@/lib/services/auth-helpers'

// GET /api/suppliers - Get all suppliers
export async function GET(request: NextRequest) {
  try {
    // Complete auth and permission check with database connection
    const authResult = await getAuthorizedClient('suppliers', 'read')
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { client: supabase } = authResult

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    


    // Build query
    let query = supabase
      .from('suppliers')
      .select('*')
      .is('deleted_at', null)
      .order('name')
    


    // Apply filters
    if (type) {
      if (type === 'devices') {
        query = query.or('supplier_type.eq.devices,supplier_type.eq.both')
      } else if (type === 'parts') {
        query = query.or('supplier_type.eq.parts,supplier_type.eq.both')
      } else if (type === 'both') {
        query = query.eq('supplier_type', 'both')
      }
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching suppliers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch suppliers' },
        { status: 500 }
      )
    }



    return NextResponse.json(data)
  } catch (error) {
    console.error('Suppliers API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    // Complete auth and permission check with database connection
    const authResult = await getAuthorizedClient('suppliers', 'create')
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { client: supabase, user } = authResult

    // Parse request body
    const body = await request.json()
    const {
      name,
      contact_person,
      email,
      phone,
      address,
      supplier_type,
      notes
    } = body

    // Validate required fields
    if (!name || !supplier_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name and supplier_type are required' },
        { status: 400 }
      )
    }

    // Validate supplier_type
    if (!['devices', 'parts', 'both'].includes(supplier_type)) {
      return NextResponse.json(
        { error: 'Invalid supplier_type. Must be one of: devices, parts, both' },
        { status: 400 }
      )
    }

    // Create supplier
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name,
        contact_person,
        email,
        phone,
        address,
        supplier_type,
        notes,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating supplier:', error)
      return NextResponse.json(
        { error: 'Failed to create supplier' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Create supplier API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/suppliers - Update a supplier
export async function PUT(request: NextRequest) {
  try {
    // Complete auth and permission check with database connection
    const authResult = await getAuthorizedClient('suppliers', 'update')
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { client: supabase, user } = authResult

    // Parse request body
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    // Validate supplier_type if provided
    if (updates.supplier_type && !['devices', 'parts', 'both'].includes(updates.supplier_type)) {
      return NextResponse.json(
        { error: 'Invalid supplier_type. Must be one of: devices, parts, both' },
        { status: 400 }
      )
    }

    // Update supplier
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Error updating supplier:', error)
      return NextResponse.json(
        { error: 'Failed to update supplier' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Update supplier API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/suppliers - Delete a supplier (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // Complete auth and permission check with database connection
    const authResult = await getAuthorizedClient('suppliers', 'delete')
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { client: supabase, user } = authResult

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      )
    }

    // Soft delete supplier
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Error deleting supplier:', error)
      return NextResponse.json(
        { error: 'Failed to delete supplier' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Delete supplier API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


