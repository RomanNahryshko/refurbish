import { PHONE_GRADES, PHONE_STATUS, USER_ROLES } from '../constants'

// Type utilities
export type ValueOf<T> = T[keyof T]

// User types
export type UserRole = ValueOf<typeof USER_ROLES>

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: UserRole
  status?: string
  must_change_password?: boolean
  created_by?: string
  last_login?: string
  created_at: string
  updated_at?: string
}

// UserAudit interface removed - not in MVP scope

// Phone status types
export type PhoneStatus = ValueOf<typeof PHONE_STATUS>
export type PhoneGrade = ValueOf<typeof PHONE_GRADES>

// Business entity types
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
  created_by?: string
  created_at: string
  updated_at?: string
  deleted_at?: string
  // Additional fields for API responses
  imported_devices_count?: number
  completed_qc_count?: number
}

export interface Phone {
  id: string
  imei: string
  model?: string
  status: PhoneStatus
  batch_id?: string
  grade?: PhoneGrade
  created_at: string
  updated_at?: string
  // Additional fields to be added as needed
  notes?: string
  repair_status?: string
  assigned_technician_id?: string
}

export interface SparePart {
  id: string
  part_name: string
  quantity: number
  min_quantity?: number
  max_quantity?: number
  unit_price?: number
  created_at: string
  updated_at?: string
}

export interface RepairJob {
  id: string
  phone_id: string
  technician_id: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  parts_used?: Array<{
    part_id: string
    quantity: number
  }>
  notes?: string
  created_at: string
  completed_at?: string
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
export interface PhoneFilters {
  status?: PhoneStatus
  batch_id?: string
  search?: string
  grade?: PhoneGrade
}

export interface DateRange {
  from: Date
  to: Date
}