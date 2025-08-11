// =====================================================
// SHARED CONSTANTS
// Application-wide constants for consistency
// =====================================================

// Device status labels for filter dropdowns
export const DEVICE_STATUS_LABELS = {
  'received': 'Received',
  'initial_qc': 'Initial QC',
  'awaiting_repair': 'Awaiting Repair',
  'in_repair': 'In Repair',
  'final_qc': 'Final QC',
  'graded': 'Graded',
  'ready_to_ship': 'Ready to Ship',
  'shipped': 'Shipped',
  'failed': 'Failed',
  'returned': 'Returned'
} as const

// Pagination settings
export const DEFAULT_ITEMS_PER_PAGE = 20

// Device grades
export const DEVICE_GRADES = ['A', 'B', 'C', 'ungraded'] as const