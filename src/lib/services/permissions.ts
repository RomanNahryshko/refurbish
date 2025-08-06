/**
 * Simple Permission Service
 * Checks permissions against the database tables
 * No complex caching - keep it simple for MVP
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Check if a user has permission to perform an action on a table
 * @param userId - The user's ID
 * @param tableName - The database table name (e.g., 'devices', 'batches')
 * @param action - The action to perform ('create', 'read', 'update', 'delete')
 * @returns true if user has permission, false otherwise
 */
export async function checkPermission(
  userId: string,
  tableName: string,
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      console.error('Supabase client not available in checkPermission')
      return false
    }
    
    // First, get the user's role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (profileError || !userProfile) {
      console.error('Error fetching user profile in checkPermission:', profileError)
      return false
    }
    
    // Check if the role has this permission
    const { data: permission } = await supabase
      .from('permissions')
      .select(`
        id,
        role_permissions!inner(role)
      `)
      .eq('table_name', tableName)
      .eq('action', action)
      .eq('role_permissions.role', userProfile.role)
      .single()
    
    // If role has permission, return true
    if (permission) return true
    
    // Check for user-specific permission overrides
    const { data: userPermission } = await supabase
      .from('permissions')
      .select(`
        id,
        user_permissions!inner(user_id, granted)
      `)
      .eq('table_name', tableName)
      .eq('action', action)
      .eq('user_permissions.user_id', userId)
      .eq('user_permissions.granted', true)
      .single()
    
    return !!userPermission
  } catch (error) {
    console.error('Permission check error:', error)
    return false // Fail closed - deny access on error
  }
}

/**
 * Get all permissions for a user (useful for caching at login)
 * @param userId - The user's ID
 * @returns Array of permissions in format 'table_name:action'
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const supabase = await createClient()
    
    // Get user's role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (!userProfile) return []
    
    // Get all permissions for the role
    const { data: rolePermissions } = await supabase
      .from('permissions')
      .select(`
        table_name,
        action,
        role_permissions!inner(role)
      `)
      .eq('role_permissions.role', userProfile.role)
    
    // Get user-specific permissions
    const { data: userPermissions } = await supabase
      .from('permissions')
      .select(`
        table_name,
        action,
        user_permissions!inner(user_id, granted)
      `)
      .eq('user_permissions.user_id', userId)
    
    // Combine permissions
    const permissions: Set<string> = new Set()
    
    // Add role permissions
    rolePermissions?.forEach(p => {
      permissions.add(`${p.table_name}:${p.action}`)
    })
    
    // Add/remove user-specific permissions
    userPermissions?.forEach(p => {
      const permString = `${p.table_name}:${p.action}`
      // @ts-ignore - we know user_permissions exists from the query
      if (p.user_permissions[0].granted) {
        permissions.add(permString)
      } else {
        permissions.delete(permString)
      }
    })
    
    return Array.from(permissions)
  } catch (error) {
    console.error('Get permissions error:', error)
    return []
  }
}

/**
 * Check if user has any of the required permissions
 * @param userId - The user's ID
 * @param requiredPermissions - Array of permissions to check (format: 'table:action')
 * @returns true if user has at least one of the required permissions
 */
export async function hasAnyPermission(
  userId: string,
  requiredPermissions: string[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  return requiredPermissions.some(perm => userPermissions.includes(perm))
}

/**
 * Check if user has all of the required permissions
 * @param userId - The user's ID
 * @param requiredPermissions - Array of permissions to check (format: 'table:action')
 * @returns true if user has all required permissions
 */
export async function hasAllPermissions(
  userId: string,
  requiredPermissions: string[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  return requiredPermissions.every(perm => userPermissions.includes(perm))
}