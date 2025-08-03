import { NextRequest, NextResponse } from 'next/server'
import { usersApi } from '@/lib/api/users'
import { requireUserManagementAccess } from '@/lib/auth/server-rbac'

// GET /api/admin/users/[id]/audit - Get user audit logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check RBAC - only ops_manager can access
  const rbacError = await requireUserManagementAccess(request)
  if (rbacError) return rbacError

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const auditLogs = await usersApi.getAuditLogs(id, limit)
    
    return NextResponse.json(auditLogs)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}