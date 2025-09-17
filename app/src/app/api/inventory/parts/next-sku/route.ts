import { NextResponse } from 'next/server'
import { inventoryApi } from '@/lib/api/inventory'
import { requirePermission } from '@/lib/services/auth-helpers'

// GET /api/inventory/parts/next-sku - Get next available SKU
export async function GET() {
  try {
    // Only require authentication for viewing
    const authError = await requirePermission('spare_parts', 'read')
    if (authError) {
      return authError
    }

    const nextSku = await inventoryApi.getNextSku()
    
    return NextResponse.json({ sku: nextSku })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get next SKU' },
      { status: 500 }
    )
  }
}
