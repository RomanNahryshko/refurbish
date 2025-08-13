import { NextRequest, NextResponse } from 'next/server'
import { inventoryApi } from '@/lib/api/inventory'
import { requirePermission } from '@/lib/services/auth-helpers'

// POST /api/inventory/parts/usage - Record parts usage in repairs (technicians can use)
export async function POST(request: NextRequest) {
  // Check permission for recording parts usage
  const authError = await requirePermission('repair_parts_used', 'create')
  if (authError) return authError

  try {
    const body = await request.json()
    const { repair_id, parts_used } = body

    if (!repair_id || !Array.isArray(parts_used) || parts_used.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: repair_id and parts_used array' },
        { status: 400 }
      )
    }

    // Validate parts_used structure
    for (const part of parts_used) {
      if (!part.spare_part_id || !part.quantity_used || part.quantity_used <= 0) {
        return NextResponse.json(
          { error: 'Each part must have spare_part_id and positive quantity_used' },
          { status: 400 }
        )
      }
    }

    // Record parts usage (this will trigger DB triggers to deduct stock)
    await inventoryApi.recordPartsUsage(repair_id, parts_used)
    
    return NextResponse.json({ 
      success: true, 
      message: `Recorded usage of ${parts_used.length} parts for repair ${repair_id}` 
    })
  } catch (error) {
    console.error('Error recording parts usage:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record parts usage' },
      { status: 500 }
    )
  }
}
