import { UserRole } from '@/lib/types'
import { USER_ROLES } from '@/lib/constants'

// Define permissions for each role
export const rolePermissions: Record<UserRole, string[]> = {
  [USER_ROLES.DATA_ENTRY]: [
    'batch.create',
    'batch.read',
    'phone.create',
    'phone.read',
    'phone.update.status',
    'shipping.create',
    'shipping.read',
  ],
  [USER_ROLES.QC_CONTROLLER]: [
    'phone.read',
    'phone.update.qc',
    'phone.update.grade',
    'repair.read',
  ],
  [USER_ROLES.TECHNICIAN]: [
    'phone.read',
    'phone.update.repair',
    'repair.create',
    'repair.read',
    'repair.update',
    'inventory.read',
    'inventory.update',
  ],
  [USER_ROLES.OPS_MANAGER]: [
    // Ops managers have all permissions
    '*',
  ],
}

// Check if a user role has a specific permission
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const permissions = rolePermissions[userRole]
  
  // Check for wildcard permission (ops_manager)
  if (permissions.includes('*')) {
    return true
  }
  
  // Check for exact permission
  if (permissions.includes(permission)) {
    return true
  }
  
  // Check for partial wildcard (e.g., 'phone.*' matches 'phone.read')
  const permissionParts = permission.split('.')
  for (let i = permissionParts.length; i > 0; i--) {
    const wildcardPermission = permissionParts.slice(0, i).join('.') + '.*'
    if (permissions.includes(wildcardPermission)) {
      return true
    }
  }
  
  return false
}

// Get all permissions for a role
export function getRolePermissions(userRole: UserRole): string[] {
  return rolePermissions[userRole] || []
}

// Check if user can access a specific module
export function canAccessModule(userRole: UserRole, module: string): boolean {
  const modulePermissions: Record<string, string[]> = {
    'batch-intake': ['batch.create', 'batch.read'],
    'phone-tracking': ['phone.read'],
    'repair-jobs': ['repair.create', 'repair.read', 'repair.update'],
    'inventory': ['inventory.read', 'inventory.update'],
    'shipping': ['shipping.create', 'shipping.read'],
    'admin': ['*'],
    'dashboard': ['batch.read', 'phone.read'], // Dashboard requires basic read permissions
  }
  
  const requiredPermissions = modulePermissions[module] || []
  
  // Check if user has at least one of the required permissions
  return requiredPermissions.some(permission => hasPermission(userRole, permission))
} 