/**
 * Enhanced Permission Service with Role-Based Configuration
 * Supports both database permissions and configuration-based permissions
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getRolePermissions } from '@/lib/config/permissions';
import { type PermissionString, type UserRole } from '@/lib/types/business-types';

// Simple in-memory cache for user roles to prevent duplicate queries
const userRoleCache = new Map<string, { role: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached user role or fetch from database
 */
async function getCachedUserRole(userId: string): Promise<string | null> {
  const now = Date.now()
  const cached = userRoleCache.get(userId)
  
  // Return cached role if still valid
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.role
  }
  
  // Fetch from database
  try {
    const supabase = await createSupabaseServerClient()
    if (!supabase) return null
    
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error || !userProfile) return null
    
    // Cache the role
    userRoleCache.set(userId, { role: userProfile.role, timestamp: now })
    return userProfile.role
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

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
    const supabase = await createSupabaseServerClient()
    
    if (!supabase) {
      console.error('Supabase client not available in checkPermission')
      return false
    }
    
    // Get the auth user to check for superadmin status
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    // Check if this is a Supabase superadmin
    if (authUser && authUser.id === userId) {
      const isSuperAdmin = authUser.app_metadata?.role === 'service_role' || // TODO: use enum
                          authUser.user_metadata?.role === 'superadmin' ||
                          authUser.email?.endsWith('@supabase.io')
      
      if (isSuperAdmin) {
        console.log('Superadmin access granted for:', authUser.email)
        return true
      }
    }
    
    // Get the user's role from profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (profileError || !userProfile) {
      console.error('Error fetching user profile in checkPermission:', profileError)
      // If no profile exists but user is authenticated, check if they're a superadmin
      if (authUser && authUser.id === userId) {
        // Already checked above, so this user has no permissions
        console.log('No user profile found for:', authUser.email)
      }
      return false
    }
    
    // Special case: admin role has all permissions
    if (userProfile.role === 'admin') {
      return true
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
 * Get all permissions for a user (supports both DB and config-based permissions)
 * @param userId - The user's ID
 * @returns Array of permissions in format 'table_name:action'
 */
export async function getUserPermissions(userId: string): Promise<PermissionString[]> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get user's role from cache or database
    const userRole = await getCachedUserRole(userId)
    if (!userRole) return []
    
    // Admin gets all permissions
    if (userRole === 'admin') {
      return ['*'] as unknown as PermissionString[] // Special marker for admin
    }
    
    // Start with configuration-based permissions for the role
    const configPermissions = getRolePermissions(userRole as UserRole)
    const permissions: Set<PermissionString> = new Set(configPermissions)
    
    try {
      // Get database permissions (if tables exist)
      const { data: rolePermissions } = await supabase
        .from('permissions')
        .select(`
          table_name,
          action,
          role_permissions!inner(role)
        `)
        .eq('role_permissions.role', userRole)
      
      // Get user-specific permissions
      const { data: userPermissions } = await supabase
        .from('permissions')
        .select(`
          table_name,
          action,
          user_permissions!inner(user_id, granted)
        `)
        .eq('user_permissions.user_id', userId)
      
      // Add database role permissions
      rolePermissions?.forEach(p => {
        permissions.add(`${p.table_name}:${p.action}` as PermissionString)
      })
      
      // Add/remove user-specific permissions
      userPermissions?.forEach(p => {
        const permString = `${p.table_name}:${p.action}` as PermissionString
        if (p.user_permissions[0].granted) {
          permissions.add(permString)
        } else {
          permissions.delete(permString)
        }
      })
    } catch (dbError) {
      // If DB permission tables don't exist or have issues, use config-based permissions
      console.warn('Database permission check failed, using config-based permissions:', dbError)
    }
    
    return Array.from(permissions)
  } catch (error) {
    console.error('Get permissions error:', error)
    
    // Fallback to config-based permissions for the role
    try {
      const userRole = await getCachedUserRole(userId)
      if (userRole && userRole !== 'admin') {
        return getRolePermissions(userRole as UserRole)
      }
    } catch (fallbackError) {
      console.error('Fallback permission check failed:', fallbackError)
    }
    
    return []
  }
}

/**
 * Clear user role cache (call this when user role changes)
 */
export function clearUserRoleCache(userId: string) {
  userRoleCache.delete(userId)
}

/**
 * Check if user has any of the required permissions
 * @param userId - The user's ID
 * @param requiredPermissions - Array of permissions to check (format: 'table:action')
 * @returns true if user has at least one of the required permissions
 */
export async function hasAnyPermission(
  userId: string,
  requiredPermissions: PermissionString[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  
  // Admin has all permissions
  if (userPermissions.includes('*' as unknown as PermissionString)) {
    return true
  }
  
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
  requiredPermissions: PermissionString[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  
  // Admin has all permissions
  if (userPermissions.includes('*' as unknown as PermissionString)) {
    return true
  }
  
  return requiredPermissions.every(perm => userPermissions.includes(perm))
}