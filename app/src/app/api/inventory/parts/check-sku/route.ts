import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
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

    const supabase = await createSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Check if SKU is unique
    let query = supabase
      .from('spare_parts')
      .select('id')
      .eq('sku', sku)
      .is('deleted_at', null)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error checking SKU:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    const isUnique = data.length === 0
    
    return NextResponse.json({ isUnique })
  } catch (error) {
    console.error('Error checking SKU:', error)
    return NextResponse.json(
      { error: 'Failed to check SKU uniqueness' },
      { status: 500 }
    )
  }
}
