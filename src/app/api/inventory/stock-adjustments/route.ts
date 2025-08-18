import { NextRequest, NextResponse } from 'next/server'
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments'
import { requirePermission } from '@/lib/services/auth-helpers'
import { createClient } from '@/lib/supabase/server'

// POST /api/inventory/stock-adjustments - Create stock adjustment (ops_manager/admin only)
export async function POST(request: NextRequest) {
  // Check permission for stock adjustments
  const authError = await requirePermission('stock_adjustments', 'create')
  if (authError) return authError

  try {
    const body = await request.json()
    const { spare_part_id, adjustment_type, quantity, reason, reference_number } = body

    if (!spare_part_id || !adjustment_type || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: spare_part_id, adjustment_type, quantity' },
        { status: 400 }
      )
    }

    // Validate UUID format for spare_part_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(spare_part_id)) {
      return NextResponse.json(
        { error: 'Invalid spare_part_id format. Must be a valid UUID' },
        { status: 400 }
      )
    }

    // Validate adjustment type
    if (!['add', 'remove', 'correction'].includes(adjustment_type)) {
      return NextResponse.json(
        { error: 'Invalid adjustment_type. Must be: add, remove, or correction' },
        { status: 400 }
      )
    }

    // Check if spare part exists
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data: sparePart, error: sparePartError } = await supabase
      .from('spare_parts')
      .select('id, quantity_in_stock')
      .eq('id', spare_part_id)
      .is('deleted_at', null)
      .single()

    if (sparePartError) {
      return NextResponse.json(
        { error: `Database error: ${sparePartError.message}` },
        { status: 500 }
      )
    }

    if (!sparePart) {
      return NextResponse.json(
        { error: 'Spare part not found' },
        { status: 404 }
      )
    }

    // For 'add' type, require reference number (invoice)
    if (adjustment_type === 'add' && !reference_number) {
      return NextResponse.json(
        { error: 'Reference number (invoice) is required for stock additions' },
        { status: 400 }
      )
    }

    // For removal, check if we have enough stock
    if (adjustment_type === 'remove' && sparePart.quantity_in_stock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for removal. Available: ${sparePart.quantity_in_stock}, Requested: ${quantity}` },
        { status: 400 }
      )
    }

      console.log('adjustment_type', adjustment_type)

    // Call appropriate method based on adjustment type
    let result
    switch (adjustment_type) {
      case 'add':
        result = await stockAdjustmentsApi.addStock({
          spare_part_id,
          adjustment_type,
          quantity,
          reference_number,
          reason
        })
        break
      case 'remove':
        result = await stockAdjustmentsApi.removeStock({
          spare_part_id,
          adjustment_type,
          quantity,
          reason
        })
        break
      case 'correction':
        result = await stockAdjustmentsApi.correctStock({
          spare_part_id,
          adjustment_type,
          quantity,
          reason
        })
        break
    }

          // Update the spare part stock level
    let newStockLevel: number = 0
    let shouldUpdateStock = true
    
    switch (adjustment_type) {
      case 'add':
        newStockLevel = sparePart.quantity_in_stock + quantity
        break
      case 'remove':
        newStockLevel = sparePart.quantity_in_stock - quantity
        break
      case 'correction':
        // For correction, the database trigger automatically updates the stock
        // So we don't need to manually update it here
        shouldUpdateStock = false
        break
      default:
        newStockLevel = sparePart.quantity_in_stock
    }

    // Update the spare part only if not handled by database trigger
    if (shouldUpdateStock) {
      const { error: updateError } = await supabase
        .from('spare_parts')
        .update({ quantity_in_stock: newStockLevel })
        .eq('id', spare_part_id)

      if (updateError) {
        // Don't fail the request, just log the error
        console.error('Failed to update spare part stock:', updateError)
      }
    }
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create stock adjustment' },
      { status: 500 }
    )
  }
}
