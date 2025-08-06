import { NextRequest, NextResponse } from 'next/server'
import { usersApi } from '@/lib/api/users'
import { requirePermission } from '@/lib/services/auth-helpers'

// POST /api/admin/users/[id]/reset-password - Reset user password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission
  const authError = await requirePermission('user_profiles', 'update')
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const { email, performedBy } = body

    if (!email || !performedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: email, performedBy' },
        { status: 400 }
      )
    }

    const result = await usersApi.resetPassword(id, email, performedBy)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reset password' },
      { status: 500 }
    )
  }
}