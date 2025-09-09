import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/services/auth-helpers'
import { apiFactory } from '@/lib/api/api-factory'

// GET /api/inventory/parts - List spare parts (all authenticated users can view)
export async function GET(request: NextRequest) {
  // Only require authentication, not specific permissions for viewing
  const authError = await requirePermission('spare_parts', 'read')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      supplier_id: searchParams.get('supplier_id') || undefined,
      low_stock: searchParams.get('low_stock') === 'true' ? true : undefined,
    }

    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    )

    const inventoryApi = await apiFactory.getInventoryAPI()
    const parts = await inventoryApi.getAllParts(Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined)
    
    return NextResponse.json(parts)
  } catch (error) {
    console.error('Error fetching parts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parts' },
      { status: 500 }
    )
  }
}

// POST /api/inventory/parts - Create new spare part (ops_manager/admin only)
export async function POST(request: NextRequest) {
  // Check permission for creating parts
  const authError = await requirePermission('spare_parts', 'create')
  if (authError) return authError

  try {
    const body = await request.json()
    const partData = body

    if (!partData?.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    const inventoryApi = await apiFactory.getInventoryAPI()
    const result = await inventoryApi.createPart(partData)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating part:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create part' },
      { status: 500 }
    )
  }
}
