import { NextRequest, NextResponse } from 'next/server'
import { usersApi } from '@/lib/api/users'
import { requirePermission } from '@/lib/services/auth-helpers'

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