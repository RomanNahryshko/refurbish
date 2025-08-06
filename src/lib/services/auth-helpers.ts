/**
 * Authentication and Permission Helper Functions
 * Simplifies permission checking in API routes
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkPermission } from './permissions'

/**
 * Check if user is authenticated and has permission
 * Returns error response if not authorized, null if authorized
 */
export async function requirePermission(
  tableName: string,
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<NextResponse | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  
  return { user }
}