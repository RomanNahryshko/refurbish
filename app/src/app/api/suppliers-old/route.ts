import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/services/permissions'

// GET /api/suppliers - Get all suppliers
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
    const hasPermission = await checkPermission(user.id, 'suppliers', 'read')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

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
    const hasPermission = await checkPermission(user.id, 'suppliers', 'create')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

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


