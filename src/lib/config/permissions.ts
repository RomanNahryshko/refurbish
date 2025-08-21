/**
 * Permission Configuration
 * Defines role-based permissions according to business requirements
 */

import {
    type PermissionString,
    type RolePermissions,
    type TechnicianLevelPermissions,
    type UserRole,
    type RepairType
} from '@/lib/types/business-types'
import {
    USER_ROLES,
    TECHNICIAN_LEVELS
} from '@/lib/constants'

// Define permissions for each role according to requirements
export const ROLE_PERMISSIONS: RolePermissions = {
  // General Manager: Full system access, reporting and analytics
  general_manager: [
    // Full read access to everything
    'user_profiles:read',
    'suppliers:read',
    'batches:read',
    'devices:read',
    'device_status_history:read',
    'qc_checks:read',
    'qc_test_results:read',
    'repair_jobs:read',
    'repair_parts_used:read',
    'spare_parts:read',
    'stock_adjustments:read',
    'production_metrics:read',
    
    // Create/Update permissions for operational data
    'suppliers:create',
    'suppliers:update',
    'batches:create',
    'batches:update',
    'devices:create',
    'devices:update',
    'spare_parts:create',
    'spare_parts:update',
    'stock_adjustments:create',
    'production_metrics:create',
    'production_metrics:update',
    
    // User management
    'user_profiles:create',
    'user_profiles:update'
  ],

  // Operations Manager: Batch intake, initial QC, repair job creation
  ops_manager: [
    // Batch management
    'batches:create',
    'batches:read',
    'batches:update',
    
    // Device management
    'devices:create',
    'devices:read',
    'devices:update',
    'device_status_history:read',
    
    // Repair job management
    'repair_jobs:create',
    'repair_jobs:read',
    'repair_jobs:update',
    
    // Initial QC only (not final QC)
    'qc_checks:create', // Can create initial QC checks in batch-intake
    'qc_checks:read',   // Can read QC results
    'qc_test_results:read'
    
    // Note: suppliers, spare_parts, stock_adjustments not available to ops_manager
    // Important: No access to /qc page - only initial QC in batch-intake
  ],

  // Quality Control: Post-repair QC, grading decisions only
  qc_controller: [
    // QC operations only - does not manage devices directly
    'qc_checks:create',
    'qc_checks:read',
    'qc_checks:update',
    'qc_test_results:create',
    'qc_test_results:read',
    'qc_test_results:update',
    
    // Minimal rights to update grade through QC API
    'devices:update' // Only for writing grade through QC process
    
    // Note: devices:read, device_status_history:read - access only through QC page
    // Note: repair_jobs:read - does not manage repairs
    // QC Controller works only with QC page for final grading
  ],

  // Technicians: Level-based repair permissions
  technician: [
    // Device access
    'devices:read',
    
    // Repair job management (only assigned jobs)
    'repair_jobs:read',
    'repair_jobs:update', // To update status, completion
    
    // Parts usage tracking
    'repair_parts_used:create',
    'repair_parts_used:read',
    
    // Inventory visibility
    'spare_parts:read'
  ]
}

// Technician level specific repair type permissions
export const TECHNICIAN_REPAIR_PERMISSIONS: TechnicianLevelPermissions = {
  L1: ['housing_change'], // Housing repairs only
  L2: ['glass_change'],   // Glass repairs only
  L3: ['battery_change', 'other', 'software_update'] // Battery, other repairs, and software updates
}

// No universal repairs - all repairs are level-specific
export const UNIVERSAL_TECHNICIAN_REPAIRS: RepairType[] = []

/**
 * Get base permissions for a user role
 */
export function getRolePermissions(role: UserRole): PermissionString[] {
  // Admin gets all permissions (handled separately in permission service)
  if (role === USER_ROLES.admin) {
    return []
  }
  
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Get repair types that a technician can perform based on their level
 */
export function getTechnicianRepairTypes(level: string): RepairType[] {
  const levelPermissions = TECHNICIAN_REPAIR_PERMISSIONS[level as keyof TechnicianLevelPermissions] || []
  return [...levelPermissions, ...UNIVERSAL_TECHNICIAN_REPAIRS]
}

/**
 * Check if a technician level can perform a specific repair type
 */
export function canTechnicianPerformRepair(level: string, repairType: RepairType): boolean {
  const allowedTypes = getTechnicianRepairTypes(level)
  return allowedTypes.includes(repairType)
}

/**
 * Get all available permissions (for UI management)
 */
export function getAllAvailablePermissions(): PermissionString[] {
  const tables = [
    'user_profiles',
    'suppliers', 
    'batches',
    'devices',
    'device_status_history',
    'qc_checks',
    'qc_test_results',
    'repair_jobs',
    'repair_parts_used',
    'spare_parts',
    'stock_adjustments',
    'production_metrics'
  ] as const
  
  const actions = ['create', 'read', 'update', 'delete'] as const
  
  const permissions: PermissionString[] = []
  
  for (const table of tables) {
    for (const action of actions) {
      permissions.push(`${table}:${action}`)
    }
  }
  
  return permissions
}

/**
 * Role display names for UI
 */
export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.admin]: 'Administrator',
  [USER_ROLES.general_manager]: 'General Manager',
  [USER_ROLES.ops_manager]: 'Operations Manager',
  [USER_ROLES.qc_controller]: 'Quality Control',
  [USER_ROLES.technician]: 'Technician'
} as const

/**
 * Technician level display names for UI
 */
export const TECHNICIAN_LEVEL_DISPLAY_NAMES = {
  [TECHNICIAN_LEVELS.L1]: 'Level 1 (Housing)',
  [TECHNICIAN_LEVELS.L2]: 'Level 2 (Glass)',
  [TECHNICIAN_LEVELS.L3]: 'Level 3 (Battery & Others)'
} as const
