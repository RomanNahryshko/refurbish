import { NextRequest, NextResponse } from 'next/server'
import { usersApi } from '@/lib/api/users'
import { requirePermission } from '@/lib/services/auth-helpers'

// GET /api/admin/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission
  const authError = await requirePermission('user_profiles', 'read')
  if (authError) return authError

  try {
    const { id } = await params
    const user = await usersApi.getById(id)
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] - Update user
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
    const { userData, performedBy } = body

    const result = await usersApi.update(id, userData, performedBy)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    )
  }
}