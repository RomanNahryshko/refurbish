// =====================================================
// SHARED CONSTANTS
// Application-wide constants for consistency
// =====================================================

// User roles enum - matches database schema exactly
export const USER_ROLES = {
  'admin': 'admin',
  'general_manager': 'general_manager',
  'ops_manager': 'ops_manager',
  'qc_controller': 'qc_controller',
  'technician': 'technician'
} as const

// Technician levels enum - matches database schema
export const TECHNICIAN_LEVELS = {
  'L1': 'L1',  // Housing repairs only
  'L2': 'L2',  // Glass repairs only
  'L3': 'L3'   // Battery and other repairs
} as const

// Device status enum - matches database schema exactly
export const DEVICE_STATUS = {
  'received': 'received',           // Just received in batch
  'initial_qc': 'initial_qc',       // In initial quality control
  'awaiting_repair': 'awaiting_repair', // QC complete, waiting for repair
  'in_repair': 'in_repair',         // Currently being repaired
  'final_qc': 'final_qc',           // In final quality control
  'graded': 'graded',               // QC complete and graded
  'ready_to_ship': 'ready_to_ship', // Ready for shipping
  'shipped': 'shipped'              // Shipped out
} as const

// Device status labels for filter dropdowns
export const DEVICE_STATUS_LABELS = {
  'received': 'Received',
  'initial_qc': 'Initial QC',
  'awaiting_repair': 'Awaiting Repair',
  'in_repair': 'In Repair',
  'final_qc': 'Final QC',
  'graded': 'Graded',
  'ready_to_ship': 'Ready to Ship',
  'shipped': 'Shipped'
} as const

// Device grades enum - matches database schema
export const DEVICE_GRADES = {
  'ungraded': 'ungraded',
  'A': 'A',         // Best condition
  'B': 'B',         // Good condition
  'C': 'C'          // Acceptable condition
} as const

// Repair task types enum - matches database schema
export const REPAIR_TYPES = {
  'housing_change': 'housing_change',   // L1 technician only
  'glass_change': 'glass_change',       // L2 technician only
  'battery_change': 'battery_change',   // L3 technician only
  'software_update': 'software_update', // Any technician
  'other': 'other'                      // Other repairs with description
} as const

// Repair job status enum - matches database schema
export const REPAIR_STATUS = {
  'pending': 'pending',       // Created but not started
  'in_progress': 'in_progress', // Currently being worked on
  'completed': 'completed',     // Successfully completed
  'failed': 'failed',           // Could not complete
  'cancelled': 'cancelled'      // Cancelled by manager
} as const

// QC test result enum - matches database schema
export const TEST_RESULT = {
  'pass': 'pass',
  'fail': 'fail',
  'not_tested': 'not_tested'
} as const

// User account status enum - matches database schema
export const USER_STATUS = {
  'active': 'active',
  'inactive': 'inactive',
  'suspended': 'suspended'
} as const

// Pagination settings
export const DEFAULT_ITEMS_PER_PAGE = 20