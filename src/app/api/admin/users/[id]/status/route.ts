import { NextRequest, NextResponse } from 'next/server'
import { createUsersAPI } from '@/lib/api/users'
import { requirePermission } from '@/lib/services/auth-helpers'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// PUT /api/admin/users/[id]/status - Update user status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission
  const authError = await requirePermission('user_profiles', 'update')
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const { status, performedBy } = body

    if (!status || !performedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: status, performedBy' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 })
    }
    
    const usersApi = createUsersAPI(supabase)
    const result = await usersApi.updateStatus(id, status, performedBy)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating user status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user status' },
      { status: 500 }
    )
  }
}