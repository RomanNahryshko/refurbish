// =====================================================
// TYPE DEFINITIONS FOR MOCK DATA
// These types match the schema.sql structure
// =====================================================

// User roles
export type UserRole = 
  | 'admin'
  | 'general_manager'
  | 'ops_manager'
  | 'qc_controller'
  | 'technician'

// Technician levels
export type TechnicianLevel = 'L1' | 'L2' | 'L3' | null

// Device status
export type DeviceStatus = 
  | 'received'
  | 'initial_qc'
  | 'awaiting_repair'
  | 'in_repair'
  | 'final_qc'
  | 'graded'
  | 'ready_to_ship'
  | 'shipped'

// Device grades
export type DeviceGrade = 'ungraded' | 'A' | 'B' | 'C'

// Repair types
export type RepairType = 
  | 'housing_change'
  | 'glass_change'
  | 'battery_change'
  | 'software_update'
  | 'other'

// Repair status
export type RepairStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'

// Test results
export type TestResult = 'pass' | 'fail' | 'not_tested'

// User status
export type UserStatus = 'active' | 'inactive' | 'suspended'

// =====================================================
// ENTITY TYPES
// =====================================================

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  technician_level: TechnicianLevel
  status: UserStatus
  phone_number?: string
  employee_id?: string
  must_change_password?: boolean
  last_login?: string
  created_at: string
  updated_at?: string
}

export interface Supplier {
  id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  supplier_type: 'devices' | 'parts' | 'both'
  notes?: string
  created_at: string
}

export interface Batch {
  id: string
  batch_number: string
  supplier_id: string
  supplier_name?: string // Joined from supplier
  invoice_number?: string
  invoice_date?: string
  invoice_amount?: number
  device_count: number
  received_date: string
  notes?: string
  created_at: string
}

export interface Device {
  id: string
  internal_id: string
  batch_id: string
  imei: string
  serial_number?: string
  brand?: string
  model?: string
  color?: string
  storage_capacity?: string
  status: DeviceStatus
  grade: DeviceGrade
  dr_phone_data?: DrPhoneData
  dr_phone_imported_at?: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface QCCheck {
  id: string
  device_id: string
  device_internal_id?: string // For display
  device_model?: string // For display
  check_type: 'initial' | 'final'
  overall_result: TestResult
  grade_assigned?: DeviceGrade
  performed_by: string
  performed_by_name?: string // Joined from user
  performed_at: string
  notes?: string
  test_results?: QCTestResult[]
}

export interface QCTestResult {
  test_name: string
  result: TestResult
  notes?: string
}

export interface RepairJob {
  id: string
  device_id: string
  device_internal_id?: string // For display
  device_model?: string // For display
  repair_type: RepairType
  description?: string
  status: RepairStatus
  assigned_to?: string
  assigned_to_name?: string // Joined from user
  assigned_at?: string
  completed_at?: string
  completion_notes?: string
  parts_used?: RepairPartUsed[]
  created_at: string
  updated_at?: string
}

export interface RepairPartUsed {
  spare_part_id: string
  part_name?: string // For display
  quantity_used: number
  notes?: string
}

export interface SparePart {
  id: string
  sku: string
  name: string
  description?: string
  category?: string
  compatible_models?: string[]
  quantity_in_stock: number
  minimum_stock_level: number
  unit_cost?: number
  supplier_name?: string // Joined from supplier
  low_stock?: boolean // Computed field
}

export interface StockAdjustment {
  id: string
  spare_part_id: string
  part_name?: string // For display
  adjustment_type: 'add' | 'remove' | 'correction'
  quantity: number
  reason?: string
  reference_number?: string
  performed_by?: string
  performed_by_name?: string // Joined from user
  created_at: string
}

export interface ProductionMetrics {
  today: MetricData
  week: MetricData
  month: MetricData
}

export interface MetricData {
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
}

// =====================================================
// FORM TYPES
// =====================================================

export interface CreateBatchForm {
  supplier_id: string
  invoice_number?: string
  invoice_date?: string
  invoice_amount?: number
  device_count: number
  received_date: string
  notes?: string
}

export interface CreateDeviceForm {
  batch_id: string
  imei: string
  serial_number?: string
  brand?: string
  model?: string
  color?: string
  storage_capacity?: string
  notes?: string
}

export interface CreateRepairForm {
  device_id: string
  repair_type: RepairType
  description?: string
}

export interface QCCheckForm {
  device_id: string
  check_type: 'initial' | 'final'
  test_results: {
    camera?: TestResult
    screen?: TestResult
    battery?: TestResult
    speaker?: TestResult
    microphone?: TestResult
    wifi?: TestResult
    bluetooth?: TestResult
    charging_port?: TestResult
    buttons?: TestResult
    housing?: TestResult
  }
  overall_result: TestResult
  grade_assigned?: DeviceGrade
  notes?: string
}

export interface StockAdjustmentForm {
  spare_part_id: string
  adjustment_type: 'add' | 'remove' | 'correction'
  quantity: number
  reason?: string
  reference_number?: string
}

export interface UserForm {
  email: string
  full_name: string
  role: UserRole
  technician_level?: TechnicianLevel
  phone_number?: string
  employee_id?: string
}