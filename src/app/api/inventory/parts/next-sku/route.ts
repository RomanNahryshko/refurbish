import { NextRequest, NextResponse } from 'next/server'
import { inventoryApi } from '@/lib/api/inventory'
import { requirePermission } from '@/lib/services/auth-helpers'

// GET /api/inventory/parts/next-sku - Get next available SKU
export async function GET(request: NextRequest) {
  // Only require authentication for viewing
  const authError = await requirePermission('spare_parts', 'read')
  if (authError) return authError

  try {
    const nextSku = await inventoryApi.getNextSku()
    
    return NextResponse.json({ sku: nextSku })
  } catch (error) {
    console.error('Error getting next SKU:', error)
    return NextResponse.json(
      { error: 'Failed to get next SKU' },
      { status: 500 }
    )
  }
}
