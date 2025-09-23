import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'

export async function GET(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('devices', 'read')
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const batchId = searchParams.get('batchId')
    const brand = searchParams.get('brand')
    const model = searchParams.get('model')
    const grade = searchParams.get('grade')

    // Build query with filters
    let query = supabase
      .from('devices')
      .select('id', { count: 'exact' })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (batchId) {
      query = query.eq('batch_id', batchId)
    }
    if (brand) {
      query = query.eq('brand', brand)
    }
    if (model) {
      query = query.eq('model', model)
    }
    if (grade) {
      query = query.eq('grade', grade)
    }

    const { count, error } = await query

    if (error) {
      console.error('Error counting devices:', error)
      return NextResponse.json({ 
        error: `Failed to count devices: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ data: { count: count || 0 } })

  } catch (error) {
    console.error('Error in devices count GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
