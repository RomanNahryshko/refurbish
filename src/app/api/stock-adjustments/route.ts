import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'

export async function POST(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('stock_adjustments', 'create')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { spare_part_id, adjustment_type, quantity, reason, reference_number } = await request.json()

    // Validate required fields
    if (!spare_part_id || !adjustment_type || !quantity) {
      return NextResponse.json({ 
        error: 'Missing required fields: spare_part_id, adjustment_type, quantity' 
      }, { status: 400 })
    }

    // Validate adjustment_type
    if (!['add', 'remove', 'correction'].includes(adjustment_type)) {
      return NextResponse.json({ 
        error: 'Invalid adjustment_type. Must be "add", "remove", or "correction"' 
      }, { status: 400 })
    }

    // Validate quantity
    if (quantity === 0) {
      return NextResponse.json({ 
        error: 'Quantity cannot be 0' 
      }, { status: 400 })
    }

    // Check if spare part exists
    const { data: sparePart, error: sparePartError } = await supabase
      .from('spare_parts')
      .select('id, quantity_in_stock')
      .eq('id', spare_part_id)
      .is('deleted_at', null)
      .single()

    if (sparePartError || !sparePart) {
      return NextResponse.json({ 
        error: 'Spare part not found' 
      }, { status: 404 })
    }

    // For removal, check if we have enough stock
    if (adjustment_type === 'remove' && sparePart.quantity_in_stock < quantity) {
      return NextResponse.json({ 
        error: `Insufficient stock for removal. Available: ${sparePart.quantity_in_stock}, Requested: ${quantity}` 
      }, { status: 400 })
    }

    // Create stock adjustment
    const { data: stockAdjustment, error: adjustmentError } = await supabase
      .from('stock_adjustments')
      .insert({
        spare_part_id,
        adjustment_type,
        quantity,
        reason,
        reference_number,
        performed_by: user.id
      })
      .select()
      .single()

    if (adjustmentError) {
      console.error('Error creating stock adjustment:', adjustmentError)
      return NextResponse.json({ 
        error: `Failed to create stock adjustment: ${adjustmentError.message}` 
      }, { status: 500 })
    }

    // Note: Stock level update is handled by database trigger

    return NextResponse.json({ 
      data: stockAdjustment,
      message: 'Stock adjustment created successfully' 
    })

  } catch (error) {
    console.error('Error in stock adjustments POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('stock_adjustments', 'read')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const sparePartId = searchParams.get('spare_part_id')
    const adjustmentType = searchParams.get('adjustment_type')

    let query = supabase
      .from('stock_adjustments')
      .select(`
        *,
        spare_part:spare_parts(name, sku),
        performed_by_user:user_profiles(full_name)
      `)

    // Apply filters
    if (sparePartId) {
      query = query.eq('spare_part_id', sparePartId)
    }
    if (adjustmentType) {
      query = query.eq('adjustment_type', adjustmentType)
    }

    const { data: stockAdjustments, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching stock adjustments:', error)
      return NextResponse.json({ 
        error: `Failed to fetch stock adjustments: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      data: stockAdjustments,
      message: 'Stock adjustments fetched successfully' 
    })

  } catch (error) {
    console.error('Error in stock adjustments GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
