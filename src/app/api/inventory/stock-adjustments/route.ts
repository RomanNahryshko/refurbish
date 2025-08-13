import { NextRequest, NextResponse } from 'next/server'
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments'
import { requirePermission } from '@/lib/services/auth-helpers'

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

    // Validate adjustment type
    if (!['add', 'remove', 'correction'].includes(adjustment_type)) {
      return NextResponse.json(
        { error: 'Invalid adjustment_type. Must be: add, remove, or correction' },
        { status: 400 }
      )
    }

    // For 'add' type, require reference number (invoice)
    if (adjustment_type === 'add' && !reference_number) {
      return NextResponse.json(
        { error: 'Reference number (invoice) is required for stock additions' },
        { status: 400 }
      )
    }

    // Call appropriate method based on adjustment type
    let result
    switch (adjustment_type) {
      case 'add':
        result = await stockAdjustmentsApi.addStock(spare_part_id, quantity, reference_number, reason)
        break
      case 'remove':
        result = await stockAdjustmentsApi.removeStock(spare_part_id, Math.abs(quantity), reason)
        break
      case 'correction':
        result = await stockAdjustmentsApi.correctStock(spare_part_id, quantity, reason)
        break
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating stock adjustment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create stock adjustment' },
      { status: 500 }
    )
  }
}
