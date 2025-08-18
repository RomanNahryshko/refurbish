import { NextRequest, NextResponse } from 'next/server'
import { suppliersApi } from '@/lib/api/suppliers'
import { requirePermission } from '@/lib/services/auth-helpers'

// GET /api/suppliers/[id] - Get supplier by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only require authentication for viewing
  const authError = await requirePermission('suppliers', 'read')
  if (authError) return authError

  try {
    const { id } = await params
    const supplier = await suppliersApi.getById(id)
    
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    )
  }
}

// PUT /api/suppliers/[id] - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission for updating suppliers
  const authError = await requirePermission('suppliers', 'update')
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const supplierData = body

    const result = await suppliersApi.update(id, supplierData)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

// DELETE /api/suppliers/[id] - Delete supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission for deleting suppliers
  const authError = await requirePermission('suppliers', 'delete')
  if (authError) return authError

  try {
    const { id } = await params
    
    await suppliersApi.softDelete(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}
