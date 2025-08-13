import { NextRequest, NextResponse } from 'next/server'
import { suppliersApi } from '@/lib/api/suppliers'
import { requirePermission } from '@/lib/services/auth-helpers'

// GET /api/suppliers - List suppliers
export async function GET(request: NextRequest) {
  // Only require authentication for viewing
  const authError = await requirePermission('suppliers', 'read')
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      supplier_type: searchParams.get('supplier_type') as 'devices' | 'parts' | 'both' | undefined,
      search: searchParams.get('search') || undefined,
    }

    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    )

    const suppliers = await suppliersApi.getAll(Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined)
    
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

// POST /api/suppliers - Create new supplier
export async function POST(request: NextRequest) {
  // Check permission for creating suppliers
  const authError = await requirePermission('suppliers', 'create')
  if (authError) return authError

  try {
    const body = await request.json()
    const supplierData = body

    if (!supplierData?.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    const result = await suppliersApi.create(supplierData)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create supplier' },
      { status: 500 }
    )
  }
}
