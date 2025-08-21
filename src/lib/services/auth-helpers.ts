/**
 * Authentication and Permission Helper Functions
 * Simplifies permission checking in API routes
 */

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { checkPermission } from './permissions'
import type { User } from '@supabase/supabase-js'

/**
 * Check if user is authenticated and has permission
 * Returns error response if not authorized, null if authorized
 */
export async function requirePermission(
  tableName: string,
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<NextResponse | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check if user is Supabase superadmin (service_role)
  // Supabase dashboard users often have role metadata
  const isSuperAdmin = user.app_metadata?.role === 'service_role' || 
                       user.user_metadata?.role === 'superadmin' ||
                       user.email?.endsWith('@supabase.io')
  
  if (isSuperAdmin) {
    return null // Superadmin has all permissions
  }
  
  if (!await checkPermission(user.id, tableName, action)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  return null // User is authorized
}

/**
 * Get authenticated user or return error response
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  
  return { user }
}

/**
 * Get Supabase client with automatic error handling
 * Returns error response if connection fails, client if successful
 */
export async function getSupabaseClient(): Promise<{ client: Awaited<ReturnType<typeof createSupabaseServerClient>> } | { error: NextResponse }> {
  const supabase = await createSupabaseServerClient()
  
  if (!supabase) {
    return { 
      error: NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  }
  
  return { client: supabase }
}

/**
 * Complete auth and permission check with database connection
 * Returns error response if any check fails, client and user if successful
 */
export async function getAuthorizedClient(
  tableName: string,
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<{ client: Awaited<ReturnType<typeof createSupabaseServerClient>>; user: User } | { error: NextResponse }> {
  // Get client with connection check
  const clientResult = await getSupabaseClient()
  if ('error' in clientResult) {
    return clientResult
  }
  
  const { client: supabase } = clientResult
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  // Check if user is Supabase superadmin (service_role)
  const isSuperAdmin = user.app_metadata?.role === 'service_role' || 
                       user.user_metadata?.role === 'superadmin' ||
                       user.email?.endsWith('@supabase.io')
  
  if (isSuperAdmin) {
    return { client: supabase, user } // Superadmin has all permissions
  }
  
  // Check permission
  const hasPermission = await checkPermission(user.id, tableName, action)
  if (!hasPermission) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  
  return { client: supabase, user }
}