import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getAuthenticatedUser } from '@/lib/services/auth-helpers'
import { apiFactory } from '@/lib/api/api-factory'

// POST /api/inventory/stock-adjustments - Create stock adjustment (ops_manager/admin only)
export async function POST(request: NextRequest) {
  // Check permission for stock adjustments
  const authError = await requirePermission('stock_adjustments', 'create')
  if (authError) return authError

  try {
    // Get current user
    const userResult = await getAuthenticatedUser()
    if ('error' in userResult) {
      return userResult.error
    }
    const { user } = userResult

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

    // Check if spare part exists using inventory API
    const inventoryApi = await apiFactory.getInventoryAPI()
    const sparePart = await inventoryApi.getPartById(spare_part_id)

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

    // Create stock adjustment using API
    const stockAdjustmentsApi = await apiFactory.getStockAdjustmentsAPI()
    const result = await stockAdjustmentsApi.createAdjustment({
      spare_part_id,
      adjustment_type,
      quantity,
      reason,
      reference_number,
      performed_by: user.id
    })

    // Note: Stock levels are automatically updated by database triggers
    // - 'add' and 'remove' triggers update spare_parts.quantity_in_stock
    // - 'correction' trigger replaces spare_parts.quantity_in_stock with exact value
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create stock adjustment' },
      { status: 500 }
    )
  }
}
