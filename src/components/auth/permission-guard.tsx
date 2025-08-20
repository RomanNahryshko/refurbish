'use client'

import { type ReactNode } from 'react'
import { useUIPermissions } from '@/lib/hooks/use-permissions'
import { type UserProfile, type PermissionAction, type TableName, type RepairType } from '@/lib/types/business-types'

interface PermissionGuardProps {
  children: ReactNode
  userProfile: UserProfile | null | undefined
  /** Hide content if no permission (default: show disabled/placeholder) */
  hideOnNoPermission?: boolean
  /** Fallback content when no permission */
  fallback?: ReactNode
}

interface TablePermissionGuardProps extends PermissionGuardProps {
  /** Table to check permission for */
  table: TableName
  /** Action to check permission for */
  action: PermissionAction
}

interface RepairPermissionGuardProps extends PermissionGuardProps {
  /** Repair type to check permission for */
  repairType: RepairType
}

interface RoleGuardProps extends PermissionGuardProps {
  /** Required roles (user must have at least one) */
  roles?: string[]
  /** Check if user is admin */
  requireAdmin?: boolean
  /** Check if user is technician */
  requireTechnician?: boolean
  /** Check if user is QC */
  requireQC?: boolean
  /** Check if user is operations manager */
  requireOpsManager?: boolean
  /** Check if user is general manager */
  requireGeneralManager?: boolean
}

/**
 * Guard component that shows/hides content based on table permissions
 */
export function TablePermissionGuard({ 
  children, 
  userProfile, 
  table, 
  action, 
  hideOnNoPermission = false,
  fallback = null 
}: TablePermissionGuardProps) {
  const { hasPermission, isLoading } = useUIPermissions(userProfile)
  
  if (isLoading) {
    return <div className="animate-pulse h-4 bg-gray-200 rounded" />
  }
  
  const canAccess = hasPermission(table, action)
  
  if (!canAccess) {
    if (hideOnNoPermission) {
      return null
    }
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * Guard component that shows/hides content based on repair permissions
 */
export function RepairPermissionGuard({
  children,
  userProfile,
  repairType,
  hideOnNoPermission = false,
  fallback = null
}: RepairPermissionGuardProps) {
  const { canPerformRepair, isLoading } = useUIPermissions(userProfile)
  
  if (isLoading) {
    return <div className="animate-pulse h-4 bg-gray-200 rounded" />
  }
  
  const canAccess = canPerformRepair(repairType)
  
  if (!canAccess) {
    if (hideOnNoPermission) {
      return null
    }
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * Guard component that shows/hides content based on user roles
 */
export function RoleGuard({
  children,
  userProfile,
  roles,
  requireAdmin = false,
  requireTechnician = false,
  requireQC = false,
  requireOpsManager = false,
  requireGeneralManager = false,
  hideOnNoPermission = false,
  fallback = null
}: RoleGuardProps) {
  const { 
    isAdmin, 
    isTechnician, 
    isQC, 
    isOpsManager, 
    isGeneralManager,
    isLoading 
  } = useUIPermissions(userProfile)
  
  if (isLoading) {
    return <div className="animate-pulse h-4 bg-gray-200 rounded" />
  }
  
  let hasRequiredRole = false
  
  // Check specific role requirements
  if (requireAdmin && isAdmin) hasRequiredRole = true
  if (requireTechnician && isTechnician) hasRequiredRole = true
  if (requireQC && isQC) hasRequiredRole = true
  if (requireOpsManager && isOpsManager) hasRequiredRole = true
  if (requireGeneralManager && isGeneralManager) hasRequiredRole = true
  
  // Check if user has any of the specified roles
  if (roles && userProfile) {
    hasRequiredRole = hasRequiredRole || roles.includes(userProfile.role)
  }
  
  // If no specific requirements, check if user has any role
  if (!requireAdmin && !requireTechnician && !requireQC && !requireOpsManager && !requireGeneralManager && !roles) {
    hasRequiredRole = !!userProfile
  }
  
  if (!hasRequiredRole) {
    if (hideOnNoPermission) {
      return null
    }
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * General permission guard with multiple criteria
 */
export function PermissionGuard({
  children,
  userProfile,
  hideOnNoPermission = false,
  fallback = null
}: PermissionGuardProps) {
  if (!userProfile) {
    if (hideOnNoPermission) {
      return null
    }
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

// Convenience components for common patterns

export function AdminOnly({ children, userProfile }: { children: ReactNode; userProfile: UserProfile | null | undefined }) {
  return (
    <RoleGuard 
      userProfile={userProfile} 
      requireAdmin={true} 
      hideOnNoPermission={true}
    >
      {children}
    </RoleGuard>
  )
}

export function TechnicianOnly({ children, userProfile }: { children: ReactNode; userProfile: UserProfile | null | undefined }) {
  return (
    <RoleGuard 
      userProfile={userProfile} 
      requireTechnician={true} 
      hideOnNoPermission={true}
    >
      {children}
    </RoleGuard>
  )
}

export function QCOnly({ children, userProfile }: { children: ReactNode; userProfile: UserProfile | null | undefined }) {
  return (
    <RoleGuard 
      userProfile={userProfile} 
      requireQC={true} 
      hideOnNoPermission={true}
    >
      {children}
    </RoleGuard>
  )
}

export function ManagerOnly({ children, userProfile }: { children: ReactNode; userProfile: UserProfile | null | undefined }) {
  return (
    <RoleGuard 
      userProfile={userProfile} 
      roles={['general_manager', 'ops_manager']} 
      hideOnNoPermission={true}
    >
      {children}
    </RoleGuard>
  )
}
