// =====================================================
// SHARED CONSTANTS
// Application-wide constants for consistency
// =====================================================

// Type utility
type ValueOf<T> = T[keyof T]

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

// Spare parts categories
export const PART_CATEGORIES = {
  SCREEN: 'screen',
  BATTERY: 'battery',
  HOUSING: 'housing',
  GLASS: 'glass',
  CAMERA: 'camera',
  SPEAKER: 'speaker',
  CHARGING_PORT: 'charging_port',
  BUTTON: 'button',
  OTHER: 'other'
} as const

export type PartCategory = ValueOf<typeof PART_CATEGORIES>

// Part category labels for UI
export const PART_CATEGORY_LABELS = {
  [PART_CATEGORIES.SCREEN]: 'Screen',
  [PART_CATEGORIES.BATTERY]: 'Battery',
  [PART_CATEGORIES.HOUSING]: 'Housing',
  [PART_CATEGORIES.GLASS]: 'Glass',
  [PART_CATEGORIES.CAMERA]: 'Camera',
  [PART_CATEGORIES.SPEAKER]: 'Speaker',
  [PART_CATEGORIES.CHARGING_PORT]: 'Charging Port',
  [PART_CATEGORIES.BUTTON]: 'Button',
  [PART_CATEGORIES.OTHER]: 'Other'
} as const