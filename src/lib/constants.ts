// Application constants
export const APP_NAME = 'ReMobile Refurbish'
export const APP_DESCRIPTION = 'Mobile Phone Refurbishment & Inventory Management System'

// Phone status workflow
export const PHONE_STATUS = {
  RECEIVED: 'Received',
  IN_QC: 'In QC',
  AWAITING_REPAIR: 'Awaiting Repair',
  IN_REPAIR: 'In Repair',
  FINAL_QC: 'Final QC',
  GRADED: 'Graded',
  SHIPPED: 'Shipped',
} as const

// User roles
export const USER_ROLES = {
  DATA_ENTRY: 'data_entry',
  QC_CONTROLLER: 'qc_controller',
  TECHNICIAN: 'technician',
  OPS_MANAGER: 'ops_manager',
} as const

// Phone grades
export const PHONE_GRADES = {
  A: 'A',
  B: 'B',
  C: 'C',
} as const

// API endpoints (relative to NEXT_PUBLIC_SUPABASE_URL)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/v1/token',
    LOGOUT: '/auth/v1/logout',
    SIGNUP: '/auth/v1/signup',
    USER: '/auth/v1/user',
  },
  PHONES: '/rest/v1/phones',
  BATCHES: '/rest/v1/batches',
  SPARE_PARTS: '/rest/v1/spare_parts',
} as const

// UI constants
export const ITEMS_PER_PAGE = 20
export const DEBOUNCE_DELAY = 300 // milliseconds
export const TOAST_DURATION = 5000 // milliseconds

// Validation rules
export const VALIDATION = {
  IMEI: {
    MIN_LENGTH: 15,
    MAX_LENGTH: 17,
    PATTERN: /^[0-9]{15,17}$/,
  },
  PHONE_MODEL: {
    MAX_LENGTH: 100,
  },
  SUPPLIER: {
    MAX_LENGTH: 200,
  },
} as const 