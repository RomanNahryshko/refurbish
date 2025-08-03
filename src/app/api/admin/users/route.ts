import { NextRequest, NextResponse } from 'next/server'
import { usersApi } from '@/lib/api/users'
import { requireUserManagementAccess } from '@/lib/auth/server-rbac'

// GET /api/admin/users - List users
export async function GET(request: NextRequest) {
  // Check RBAC - only ops_manager can access
  const rbacError = await requireUserManagementAccess(request)
  if (rbacError) return rbacError

  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    }

    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    )

    const users = await usersApi.getAll(Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined)
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create user
export async function POST(request: NextRequest) {
  // Check RBAC - only ops_manager can access
  const rbacError = await requireUserManagementAccess(request)
  if (rbacError) return rbacError

  try {
    const body = await request.json()
    const { userData, performedBy } = body

    if (!userData?.email || !userData?.role || !userData?.full_name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, role, full_name' },
        { status: 400 }
      )
    }

    const result = await usersApi.create(userData, performedBy)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    )
  }
}