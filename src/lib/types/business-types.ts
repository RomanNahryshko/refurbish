import {
  USER_ROLES,
  TECHNICIAN_LEVELS,
  DEVICE_STATUS,
  DEVICE_GRADES,
  REPAIR_TYPES,
  REPAIR_STATUS,
  TEST_RESULT,
  USER_STATUS
} from '../constants'

// Type utilities
export type ValueOf<T> = T[keyof T]

// User types - matches database schema exactly
export type UserRole = ValueOf<typeof USER_ROLES>
export type TechnicianLevel = ValueOf<typeof TECHNICIAN_LEVELS>
export type UserAccountStatus = ValueOf<typeof USER_STATUS>

export interface UserProfile {
  id: string
  full_name: string
  role: UserRole
  technician_level?: TechnicianLevel // Only for technicians
  status: UserAccountStatus
  must_change_password: boolean
  phone_number?: string
  employee_id?: string
  created_by?: string
  last_login?: string
  created_at: string
  updated_at?: string
  deleted_at?: string
}

// Device types - matches database schema exactly
export type DeviceStatus = ValueOf<typeof DEVICE_STATUS>
export type DeviceGrade = ValueOf<typeof DEVICE_GRADES>

export interface Device {
  id: string
  internal_id: string // 8-digit auto-generated
  batch_id: string
  imei: string
  serial_number?: string
  brand?: string
  model?: string
  color?: string
  storage_capacity?: string
  status: DeviceStatus
  grade: DeviceGrade
  dr_phone_data?: DrPhoneData // JSONB from Dr. Phone
  dr_phone_imported_at?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at?: string
  deleted_at?: string
}

// Device status history - matches database schema
export interface DeviceStatusHistory {
  id: string
  device_id: string
  old_status?: DeviceStatus
  new_status: DeviceStatus
  changed_by?: string
  notes?: string
  created_at: string
  // Note: changed_by contains the user ID, but we don't join user data in this query
}

// Batch types - matches database schema exactly
export interface Batch {
  id: string
  batch_number: string // Auto-generated format: BATCH-YYYYMMDD-XXX
  supplier_id: string
  supplier_name?: string // Joined from supplier
  invoice_number?: string
  invoice_date?: string
  invoice_amount?: number
  device_count: number
  received_date: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at?: string
  deleted_at?: string
}

// Supplier types - matches database schema exactly
export interface Supplier {
  id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  supplier_type: 'devices' | 'parts' | 'both'
  notes?: string
  created_by?: string
  created_at: string
  updated_at?: string
  deleted_at?: string
}

// Quality Control types - matches database schema exactly
export interface QCCheck {
  id: string
  device_id: string
  check_type: 'initial' | 'final'
  overall_result: ValueOf<typeof TEST_RESULT>
  grade_assigned?: DeviceGrade
  performed_by: string
  performed_at: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface QCTestResult {
  id: string
  qc_check_id: string
  test_name: string // e.g., 'camera', 'screen', 'battery', 'speaker'
  test_result: ValueOf<typeof TEST_RESULT>
  notes?: string
  created_at: string
}

// Repair types - matches database schema exactly
export type RepairType = ValueOf<typeof REPAIR_TYPES>
export type RepairJobStatus = ValueOf<typeof REPAIR_STATUS>

export interface RepairJob {
  id: string
  device_id: string
  repair_type: RepairType
  description?: string // Required for 'other' type
  status: RepairJobStatus
  assigned_to?: string
  assigned_at?: string
  completed_at?: string
  completion_notes?: string
  created_by?: string
  created_at: string
  updated_at?: string
  deleted_at?: string
}

// Inventory types - matches database schema exactly
export interface SparePart {
  id: string
  sku: string // Stock keeping unit
  name: string
  description?: string
  category?: string // e.g., 'battery', 'screen', 'housing'
  compatible_models?: string[] // Array of model names
  quantity_in_stock: number
  minimum_stock_level?: number
  unit_cost?: number
  primary_supplier_id?: string
  suppliers?: Supplier
  created_by?: string
  created_at: string
  updated_at?: string
  deleted_at?: string
}

export interface RepairPartsUsed {
  id: string
  repair_job_id: string
  spare_part_id: string
  quantity_used: number
  notes?: string
  recorded_by?: string
  recorded_at: string
  created_at: string
}

export interface StockAdjustment {
  id: string
  spare_part_id: string
  adjustment_type: 'add' | 'remove' | 'correction'
  quantity: number // Positive for additions, negative for removals
  reason?: string
  reference_number?: string // Invoice number, PO number, etc.
  performed_by?: string
  created_at: string
}

// Production metrics - matches database schema
export interface ProductionMetrics {
  id: string
  metric_date: string
  devices_received: number
  devices_in_repair: number
  devices_completed: number
  devices_shipped: number
  housing_changes: number
  glass_changes: number
  battery_changes: number
  software_updates: number
  other_repairs: number
  grade_a_count: number
  grade_b_count: number
  grade_c_count: number
  created_at: string
}

// Permission types - matches database schema exactly
export interface Permission {
  id: string
  table_name: string // Actual database table name
  action: 'create' | 'read' | 'update' | 'delete'
  description?: string
  created_at: string
}

export interface RolePermission {
  id: string
  role: UserRole
  permission_id: string
  created_at: string
  created_by?: string
}

export interface UserPermission {
  id: string
  user_id: string
  permission_id: string
  granted: boolean // true = grant, false = revoke
  created_at: string
  created_by?: string
}

// Enhanced permission types for better type safety
export type PermissionAction = 'create' | 'read' | 'update' | 'delete'

export type TableName = 
  | 'user_profiles'
  | 'suppliers'
  | 'batches'
  | 'devices'
  | 'device_status_history'
  | 'qc_checks'
  | 'qc_test_results'
  | 'repair_jobs'
  | 'repair_parts_used'
  | 'spare_parts'
  | 'stock_adjustments'
  | 'production_metrics'

// Permission string in format 'table:action'
export type PermissionString = `${TableName}:${PermissionAction}`

// Role-based permissions configuration
export interface RolePermissions {
  // General Manager: Full system access, reporting and analytics
  general_manager: PermissionString[]
  // Operations Manager: Batch intake, QC, repair job creation
  ops_manager: PermissionString[]
  // Quality Control: Post-repair QC, grading decisions  
  qc_controller: PermissionString[]
  // Technicians: Level-based repair permissions
  technician: PermissionString[]
}

// Technician level permissions for specific repair types
export interface TechnicianLevelPermissions {
  L1: RepairType[] // Housing only
  L2: RepairType[] // Glass only  
  L3: RepairType[] // Battery + Others
}

// Enhanced user profile with permission context
export interface UserWithPermissions extends UserProfile {
  permissions?: PermissionString[]
  can_repair_types?: RepairType[] // For technicians
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: ApiError
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

// Filter types
export interface DeviceFilters {
  status?: DeviceStatus
  batch_id?: string
  search?: string
  grade?: DeviceGrade
}

export interface DateRange {
  from: Date
  to: Date
}

// Legacy types for backward compatibility (to be removed)
export type User = UserProfile
export type Phone = Device
export type PhoneStatus = DeviceStatus
export type PhoneGrade = DeviceGrade

// Dr. Phone data structure
export interface DrPhoneData {
  device_info?: {
    brand?: string
    model?: string
    color?: string
    storage?: string
    condition?: string
  }
  diagnostic_results?: {
    battery_health?: number
    screen_condition?: string
    camera_condition?: string
    speaker_condition?: string
    overall_score?: number
  }
  qc_data?: {
    selected_grade?: string
  }
  required_repairs?: string[]
  other_repair_description?: string
  repair_history?: Array<{
    date: string
    repair_type: string
    description: string
    cost: number
  }>
  notes?: string
  [key: string]: unknown // For any additional fields from Dr. Phone
}

// Test result data structure
export interface TestResultData {
  qc_check_id: string
  test_name: string
  test_result: ValueOf<typeof TEST_RESULT>
  notes?: string
  score?: number
  [key: string]: unknown
}

// Repair job data structure
export interface RepairJobData {
  device_id: string
  repair_type: RepairType
  description?: string
  assigned_to?: string
  priority?: 'low' | 'medium' | 'high'
  estimated_duration?: number // in minutes
  [key: string]: unknown
}

// Parts data structure
export interface PartsData {
  repair_job_id: string
  spare_part_id: string
  quantity_used: number
  notes?: string
  unit_cost?: number
  [key: string]: unknown
}

// Form data types
export interface BatchFormData {
  supplier_id: string
  invoice_number?: string
  invoice_date?: string
  invoice_amount?: number
  device_count: number
  received_date: string
  notes?: string
}

// Form input types (for form components that use string inputs)
export interface BatchFormInputData {
  supplier_id: string
  invoice_number: string
  invoice_date: string
  invoice_amount: string
  device_count: string
  received_date: string
  notes: string
}

export interface DeviceFormData {
  imei: string
  serial_number?: string
  brand?: string
  model?: string
  color?: string
  storage_capacity?: string
  notes?: string
}

export interface QCCheckFormData {
  device_id: string
  check_type: 'initial' | 'final'
  overall_result: ValueOf<typeof TEST_RESULT>
  grade_assigned?: DeviceGrade
  notes?: string
  test_results?: TestResultData[]
}

export interface SupplierFormData {
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  supplier_type: 'devices' | 'parts' | 'both'
  notes?: string
}

// Repair tracking types for device pages
export interface RepairTrackingData {
  id: string
  device_id: string
  device_internal_id: string
  device_model: string
  repair_type: RepairType
  description?: string
  status: RepairJobStatus
  assigned_to?: string
  assigned_to_name?: string
  assigned_at?: string
  created_at: string
  completed_at?: string
  completion_notes?: string
  parts_used?: Array<{
    part_name: string
    quantity_used: number
  }>
}

export interface PartUsageData {
  id: string
  repair_job_id: string
  spare_part_id: string
  spare_part_name: string
  quantity_used: number
  notes?: string
  recorded_by?: string
  recorded_at: string
}

// Supabase Auth User types
export interface SupabaseAuthUser {
  id: string
  email?: string
  created_at?: string
  last_sign_in_at?: string
  email_confirmed_at?: string
  app_metadata?: {
    role?: string
    [key: string]: unknown
  }
  user_metadata?: {
    role?: string
    [key: string]: unknown
  }
}

// Device status update data
export interface DeviceStatusUpdateData {
  status: DeviceStatus
  updated_at: string
  grade?: DeviceGrade
}

// QC check filter fields
export interface QCCheckFilterFields {
  [key: string]: unknown
}

// Batch creation data
export interface BatchCreationData {
  supplier_id: string
  invoice_number?: string
  invoice_date?: string
  invoice_amount?: number
  device_count: number
  received_date: string
  notes?: string
  created_by: string
}

// Admin permission marker type
export type AdminPermissionMarker = '*'
export type PermissionOrAdmin = PermissionString | AdminPermissionMarker