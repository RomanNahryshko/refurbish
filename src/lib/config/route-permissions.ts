/**
 * Route-based permissions configuration
 * Defines which routes are accessible for each role
 */

import { type UserRole } from '@/lib/types/business-types'

// Define allowed routes for each role
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  admin: [
    // Admin has access to everything
    '*'
  ],
  
  general_manager: [
    // General Manager has full access
    '*'
  ],
  
  ops_manager: [
    '/',
    '/batch-intake',
    '/batch-intake/*',
    '/devices',
    '/devices/*',
    '/repair-jobs',
    '/repair-jobs/*',
    '/inventory',
    '/inventory/*',
    '/change-password'
  ],
  
  qc_controller: [
    '/',
    '/qc',
    '/qc/*',
    '/devices',
    '/devices/*',
    '/change-password'
  ],
  
  technician: [
    '/',
    '/devices',
    '/devices/*',
    '/repair-jobs',
    '/repair-jobs/*',
    '/change-password'
  ]
}

// Routes that are blocked for ops_manager (should redirect to /)
export const OPS_MANAGER_BLOCKED_ROUTES = [
  '/suppliers',
  '/admin',
  '/mockup-overview',
  '/qc' 
]

// Routes that are blocked for qc_controller (should redirect to /)
export const QC_CONTROLLER_BLOCKED_ROUTES = [
  '/repair-jobs',
  '/inventory',
  '/suppliers',
  '/admin',
  '/mockup-overview',
  '/batch-intake'
]

// Routes that are blocked for technician (should redirect to /)
export const TECHNICIAN_BLOCKED_ROUTES = [
  '/inventory',
  '/suppliers',
  '/admin',
  '/mockup-overview',
  '/batch-intake',
  '/qc'
]

/**
 * Check if a user role has access to a specific route
 */
export function hasRouteAccess(userRole: UserRole, pathname: string): boolean {
  const allowedRoutes = ROLE_ROUTES[userRole]
  
  // Admin and General Manager have access to everything
  if (allowedRoutes.includes('*')) {
    return true
  }
  
  // Check exact match first
  if (allowedRoutes.includes(pathname)) {
    return true
  }
  
  // Check wildcard patterns (e.g., /devices/*)
  return allowedRoutes.some(route => {
    if (route.endsWith('/*')) {
      const baseRoute = route.slice(0, -2)
      return pathname.startsWith(baseRoute)
    }
    return false
  })
}

/**
 * Check if a user role has access to dashboard
 */
export function hasDashboardAccess(userRole: UserRole): boolean {
  // Only general_manager and admin have dashboard access
  return userRole === 'general_manager' || userRole === 'admin'
}

/**
 * Get the first available module for a user based on their role
 */
export function getFirstAvailableModule(_userRole: UserRole): string {
  // All authenticated users should land on homepage first
  // Homepage provides access to all allowed modules for their role
  return '/homepage'
}

/**
 * Check if a route is specifically blocked for ops_manager
 */
export function isBlockedForOpsManager(pathname: string): boolean {
  return OPS_MANAGER_BLOCKED_ROUTES.some(blockedRoute => 
    pathname.startsWith(blockedRoute)
  )
}

/**
 * Check if a route is specifically blocked for qc_controller
 */
export function isBlockedForQCController(pathname: string): boolean {
  return QC_CONTROLLER_BLOCKED_ROUTES.some(blockedRoute => 
    pathname.startsWith(blockedRoute)
  )
}

/**
 * Check if a route is specifically blocked for technician
 */
export function isBlockedForTechnician(pathname: string): boolean {
  return TECHNICIAN_BLOCKED_ROUTES.some(blockedRoute => 
    pathname.startsWith(blockedRoute)
  )
}

/**
 * Get redirect path for unauthorized access
 */
export function getRedirectPath(userRole: UserRole, pathname: string): string {
  // For ops_manager accessing blocked routes, redirect to home
  if (userRole === 'ops_manager' && isBlockedForOpsManager(pathname)) {
    return '/'
  }
  
  // For qc_controller accessing blocked routes, redirect to dashboard
  if (userRole === 'qc_controller' && isBlockedForQCController(pathname)) {
    return '/'
  }
  
  // For technician accessing blocked routes, redirect to home
  if (userRole === 'technician' && isBlockedForTechnician(pathname)) {
    return '/'
  }
  
  // For other unauthorized access, redirect based on role
  if (userRole === 'technician') {
    return '/'
  }
  return '/'
}
