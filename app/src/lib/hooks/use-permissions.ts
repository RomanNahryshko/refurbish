import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getUserPermissionsClient } from '@/lib/services/permissions-client'
import {
    type PermissionString,
    type PermissionAction,
    type TableName,
    type UserProfile,
    type RepairType
} from '@/lib/types/business-types'
import { USER_ROLES } from '@/lib/constants'
import {
    getRolePermissions,
    getTechnicianRepairTypes,
    canTechnicianPerformRepair
} from '@/lib/config/permissions'

/**
 * Hook to get all user permissions
 */
export function usePermissions(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => getUserPermissionsClient(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
    refetchOnMount: false,
    retry: 2,
  })
}

/**
 * Hook to check a specific permission
 */
export function usePermissionCheck(
  userId: string | undefined,
  tableName: TableName,
  action: PermissionAction
) {
  const { data: permissions, isLoading, error } = usePermissions(userId)
  
  const hasPermission = useMemo(() => {
    if (!permissions) return false
    return permissions.includes(`${tableName}:${action}`)
  }, [permissions, tableName, action])
  
  return {
    hasPermission,
    isLoading,
    error,
    permissions
  }
}

/**
 * Hook to check multiple permissions at once
 */
export function useMultiplePermissionCheck(
  userId: string | undefined,
  requiredPermissions: PermissionString[]
) {
  const { data: permissions, isLoading, error } = usePermissions(userId)
  
  const hasAllPermissions = useMemo(() => {
    if (!permissions) return false
    return requiredPermissions.every(perm => permissions.includes(perm))
  }, [permissions, requiredPermissions])
  
  const hasAnyPermission = useMemo(() => {
    if (!permissions) return false
    return requiredPermissions.some(perm => permissions.includes(perm))
  }, [permissions, requiredPermissions])
  
  const permissionMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    if (permissions) {
      requiredPermissions.forEach(perm => {
        map[perm] = permissions.includes(perm)
      })
    }
    return map
  }, [permissions, requiredPermissions])
  
  return {
    hasAllPermissions,
    hasAnyPermission,
    permissionMap,
    isLoading,
    error,
    permissions
  }
}

/**
 * Hook for role-based permissions with user profile context
 */
export function useRolePermissions(userProfile: UserProfile | null | undefined) {
  const { data: dbPermissions, isLoading, error } = usePermissions(userProfile?.id)
  
  const rolePermissions = useMemo(() => {
    if (!userProfile) return []
    
    // Admin gets all permissions
    if (userProfile.role === USER_ROLES.admin) {
      return ['*'] // Special marker for admin
    }
    
    return getRolePermissions(userProfile.role)
  }, [userProfile])
  
  const canRepairTypes = useMemo(() => {
    if (!userProfile || userProfile.role !== USER_ROLES.technician) {
      return []
    }
    
    return getTechnicianRepairTypes(userProfile.technician_level || 'L1')
  }, [userProfile])
  
  const hasPermission = useMemo(() => {
    return (tableName: TableName, action: PermissionAction): boolean => {
      if (!userProfile) return false
      
      // Admin has all permissions
      if (userProfile.role === USER_ROLES.admin) return true
      
      // Check database permissions (includes user-specific overrides)
      if (dbPermissions?.includes(`${tableName}:${action}`)) return true
      
      // Fallback to role-based permissions
      return rolePermissions.includes(`${tableName}:${action}`)
    }
  }, [userProfile, dbPermissions, rolePermissions])
  
  const canPerformRepair = useMemo(() => {
    return (repairType: RepairType): boolean => {
      if (!userProfile || userProfile.role !== USER_ROLES.technician) {
        return false
      }
      
      return canTechnicianPerformRepair(userProfile.technician_level || 'L1', repairType)
    }
  }, [userProfile])
  
  return {
    hasPermission,
    canPerformRepair,
    canRepairTypes,
    rolePermissions,
    dbPermissions,
    isLoading,
    error,
    isAdmin: userProfile?.role === USER_ROLES.admin,
    isTechnician: userProfile?.role === USER_ROLES.technician,
    isQC: userProfile?.role === USER_ROLES.qc_controller,
    isOpsManager: userProfile?.role === USER_ROLES.ops_manager,
    isGeneralManager: userProfile?.role === USER_ROLES.general_manager 
  }
}

/**
 * Hook for UI permission checks (commonly used patterns)
 */
export function useUIPermissions(userProfile: UserProfile | null | undefined) {
  const { 
    hasPermission, 
    canPerformRepair,
    isAdmin,
    isTechnician,
    isQC,
    isOpsManager,
    isGeneralManager,
    isLoading,
    error 
  } = useRolePermissions(userProfile)
  
  // Common UI permission patterns
  const canViewUsers = hasPermission('user_profiles', 'read')
  const canManageUsers = hasPermission('user_profiles', 'create') && hasPermission('user_profiles', 'update')
  
  const canViewBatches = hasPermission('batches', 'read')
  const canCreateBatches = hasPermission('batches', 'create')
  const canManageBatches = canCreateBatches && hasPermission('batches', 'update')
  
  const canViewDevices = hasPermission('devices', 'read')
  const canManageDevices = hasPermission('devices', 'update')
  
  const canViewRepairJobs = hasPermission('repair_jobs', 'read')
  const canCreateRepairJobs = hasPermission('repair_jobs', 'create')
  const canUpdateRepairJobs = hasPermission('repair_jobs', 'update')
  
  const canPerformQC = hasPermission('qc_checks', 'create') && hasPermission('qc_checks', 'update')
  const canViewQC = hasPermission('qc_checks', 'read')
  
  const canViewInventory = hasPermission('spare_parts', 'read')
  const canManageInventory = hasPermission('spare_parts', 'create') && hasPermission('spare_parts', 'update')
  
  const canViewReports = hasPermission('production_metrics', 'read')
  const canManageSuppliers = hasPermission('suppliers', 'create') && hasPermission('suppliers', 'update')
  
  const canRecordPartsUsage = hasPermission('repair_parts_used', 'create')
  const canAdjustStock = hasPermission('stock_adjustments', 'create')
  
  return {
    // Role checks
    isAdmin,
    isTechnician,
    isQC,
    isOpsManager,
    isGeneralManager,
    
    // Core permission functions
    hasPermission,
    canPerformRepair,
    
    // Common UI patterns
    canViewUsers,
    canManageUsers,
    canViewBatches,
    canCreateBatches,
    canManageBatches,
    canViewDevices,
    canManageDevices,
    canViewRepairJobs,
    canCreateRepairJobs,
    canUpdateRepairJobs,
    canPerformQC,
    canViewQC,
    canViewInventory,
    canManageInventory,
    canViewReports,
    canManageSuppliers,
    canRecordPartsUsage,
    canAdjustStock,
    
    // Loading state
    isLoading,
    error
  }
}
