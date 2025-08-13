import { NextRequest, NextResponse } from 'next/server'
import { inventoryApi } from '@/lib/api/inventory'
import { requirePermission } from '@/lib/services/auth-helpers'

// GET /api/inventory/parts/[id] - Get part by ID (all authenticated users can view)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only require authentication for viewing
  const authError = await requirePermission('spare_parts', 'read')
  if (authError) return authError

  try {
    const { id } = await params
    const part = await inventoryApi.getPartById(id)
    
    return NextResponse.json(part)
  } catch (error) {
    console.error('Error fetching part:', error)
    return NextResponse.json(
      { error: 'Failed to fetch part' },
      { status: 500 }
    )
  }
}

// PUT /api/inventory/parts/[id] - Update part (ops_manager/admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission for updating parts
  const authError = await requirePermission('spare_parts', 'update')
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const partData = body

    const result = await inventoryApi.updatePart(id, partData)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating part:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update part' },
      { status: 500 }
    )
  }
}

// DELETE /api/inventory/parts/[id] - Delete part (ops_manager/admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission for deleting parts
  const authError = await requirePermission('spare_parts', 'delete')
  if (authError) return authError

  try {
    const { id } = await params
    
    await inventoryApi.deletePart(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting part:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete part' },
      { status: 500 }
    )
  }
}
