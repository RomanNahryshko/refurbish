import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase'
import { hasPermission } from './rbac'
import { UserRole } from '@/lib/types/business-types'

/**
 * Server-side RBAC middleware for API routes
 * Checks if the current user has the required permission
 */
export async function checkPermission(
  request: NextRequest,
  requiredPermission: string
): Promise<{ authorized: boolean; user: any; error?: string }> {
  try {
    // Create Supabase client for server-side
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(_cookiesToSet) {
            // In API routes, we typically can't modify the response to set cookies
            // but we can still read them for auth purposes
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        authorized: false,
        user: null,
        error: 'Authentication required'
      }
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        authorized: false,
        user,
        error: 'User profile not found'
      }
    }

    // Check if user is disabled
    if (profile.status === 'disabled') {
      return {
        authorized: false,
        user,
        error: 'User account is disabled'
      }
    }

    // Check permission
    const hasAccess = hasPermission(profile.role as UserRole, requiredPermission)

    if (!hasAccess) {
      return {
        authorized: false,
        user,
        error: `Insufficient permissions. Required: ${requiredPermission}`
      }
    }

    return {
      authorized: true,
      user: {
        ...user,
        profile
      }
    }

  } catch (error) {
    console.error('RBAC check error:', error)
    return {
      authorized: false,
      user: null,
      error: 'Authorization check failed'
    }
  }
}

/**
 * Create a protected API handler that requires specific permissions
 */
export function withPermission(
  requiredPermission: string,
  handler: (request: NextRequest, context: any, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    const { authorized, user, error } = await checkPermission(request, requiredPermission)

    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      )
    }

    // Call the original handler with the authenticated user
    return handler(request, context, user)
  }
}

/**
 * Check if current user can manage users (ops_manager only)
 */
export async function canManageUsers(request: NextRequest): Promise<boolean> {
  const { authorized } = await checkPermission(request, 'user.create')
  return authorized
}

/**
 * Middleware to ensure only ops_manager can access user management APIs
 */
export async function requireUserManagementAccess(request: NextRequest) {
  const { authorized, error } = await checkPermission(request, 'user.create')
  
  if (!authorized) {
    return NextResponse.json(
      { 
        error: error || 'Access denied. Only Operations Managers can manage users.',
        requiredRole: 'ops_manager'
      },
      { status: 403 }
    )
  }

  return null // No error, access granted
}