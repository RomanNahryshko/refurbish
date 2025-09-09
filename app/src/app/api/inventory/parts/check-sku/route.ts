import { NextRequest, NextResponse } from 'next/server'
import { inventoryApi } from '@/lib/api/inventory'
import { requirePermission } from '@/lib/services/auth-helpers'

// GET /api/inventory/parts/check-sku - Check if SKU is unique
export async function GET(request: NextRequest) {
  // Only require authentication for viewing
  const authError = await requirePermission('spare_parts', 'read')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const sku = searchParams.get('sku')
    const excludeId = searchParams.get('excludeId')

    if (!sku) {
      return NextResponse.json(
        { error: 'SKU parameter is required' },
        { status: 400 }
      )
    }

    const isUnique = await inventoryApi.isSkuUnique(sku, excludeId || undefined)
    
    return NextResponse.json({ isUnique })
  } catch (error) {
    console.error('Error checking SKU:', error)
    return NextResponse.json(
      { error: 'Failed to check SKU uniqueness' },
      { status: 500 }
    )
  }
}
