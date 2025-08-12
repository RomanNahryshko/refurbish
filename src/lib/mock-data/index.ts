// =====================================================
// MOCK DATA FOR UI VALIDATION
// This file contains all mock data for testing UI before database deployment
// =====================================================

import { 
  User, 
  Batch, 
  Device, 
  RepairJob, 
  SparePart, 
  QCCheck,
  Supplier,
  ProductionMetrics 
} from '@/types/mock-types'

// =====================================================
// USERS & AUTH
// =====================================================

export const mockCurrentUser: User = {
  id: 'user-1',
  email: 'admin@remobile.com',
  full_name: 'John Admin',
  role: 'admin',
  technician_level: null,
  status: 'active',
  created_at: '2024-01-01T00:00:00Z'
}

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@remobile.com',
    full_name: 'John Admin',
    role: 'admin',
    technician_level: null,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user-2',
    email: 'manager@remobile.com',
    full_name: 'Sarah Manager',
    role: 'ops_manager',
    technician_level: null,
    status: 'active',
    created_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'user-3',
    email: 'tech1@remobile.com',
    full_name: 'Mike Technician',
    role: 'technician',
    technician_level: 'L1',
    status: 'active',
    created_at: '2024-01-03T00:00:00Z'
  },
  {
    id: 'user-4',
    email: 'tech2@remobile.com',
    full_name: 'Lisa Glass Expert',
    role: 'technician',
    technician_level: 'L2',
    status: 'active',
    created_at: '2024-01-03T00:00:00Z'
  },
  {
    id: 'user-5',
    email: 'tech3@remobile.com',
    full_name: 'Tom Battery Pro',
    role: 'technician',
    technician_level: 'L3',
    status: 'active',
    created_at: '2024-01-03T00:00:00Z'
  },
  {
    id: 'user-6',
    email: 'qc@remobile.com',
    full_name: 'Emma Quality',
    role: 'qc_controller',
    technician_level: null,
    status: 'active',
    created_at: '2024-01-04T00:00:00Z'
  }
]

// =====================================================
// SUPPLIERS
// =====================================================

export const mockSuppliers: Supplier[] = [
  {
    id: 'supplier-1',
    name: 'TechSource Ltd',
    contact_person: 'David Brown',
    email: 'david@techsource.com',
    phone: '+1234567890',
    supplier_type: 'devices',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'supplier-2',
    name: 'Parts Wholesale Inc',
    contact_person: 'Jane Smith',
    email: 'jane@partswholesale.com',
    phone: '+0987654321',
    supplier_type: 'parts',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'supplier-3',
    name: 'Mobile Traders',
    contact_person: 'Bob Wilson',
    email: 'bob@mobiletraders.com',
    phone: '+1122334455',
    supplier_type: 'both',
    created_at: '2024-01-02T00:00:00Z'
  }
]

// =====================================================
// BATCHES
// =====================================================

export const mockBatches: Batch[] = [
  {
    id: 'batch-1',
    batch_number: 'BATCH-20240115-001',
    supplier_id: 'supplier-1',
    supplier_name: 'TechSource Ltd',
    invoice_number: 'INV-2024-001',
    invoice_date: '2024-01-15',
    invoice_amount: 5000.00,
    device_count: 25,
    received_date: '2024-01-15',
    created_at: '2024-01-15T09:00:00Z'
  },
  {
    id: 'batch-2',
    batch_number: 'BATCH-20240116-001',
    supplier_id: 'supplier-3',
    supplier_name: 'Mobile Traders',
    invoice_number: 'INV-2024-002',
    invoice_date: '2024-01-16',
    invoice_amount: 7500.00,
    device_count: 40,
    received_date: '2024-01-16',
    created_at: '2024-01-16T10:00:00Z'
  },
  {
    id: 'batch-3',
    batch_number: 'BATCH-20240117-001',
    supplier_id: 'supplier-1',
    supplier_name: 'TechSource Ltd',
    invoice_number: 'INV-2024-003',
    invoice_date: '2024-01-17',
    invoice_amount: 3200.00,
    device_count: 15,
    received_date: '2024-01-17',
    created_at: '2024-01-17T11:00:00Z'
  }
]

// =====================================================
// DEVICES
// =====================================================

const mockDevicesBase: Device[] = [
  // Batch 1 devices
  {
    id: 'device-1',
    internal_id: '00000001',
    batch_id: 'batch-1',
    imei: '123456789012345',
    serial_number: 'SN123456',
    brand: 'Apple',
    model: 'iPhone 12',
    color: 'Black',
    storage_capacity: '128GB',
    status: 'graded',
    grade: 'A',
    created_at: '2024-01-15T09:30:00Z'
  },
  {
    id: 'device-2',
    internal_id: '00000002',
    batch_id: 'batch-1',
    imei: '123456789012346',
    serial_number: 'SN123457',
    brand: 'Apple',
    model: 'iPhone 11',
    color: 'White',
    storage_capacity: '64GB',
    status: 'in_repair',
    grade: 'ungraded',
    created_at: '2024-01-15T09:31:00Z'
  },
  {
    id: 'device-3',
    internal_id: '00000003',
    batch_id: 'batch-1',
    imei: '123456789012347',
    serial_number: 'SN123458',
    brand: 'Samsung',
    model: 'Galaxy S21',
    color: 'Blue',
    storage_capacity: '256GB',
    status: 'awaiting_repair',
    grade: 'ungraded',
    created_at: '2024-01-15T09:32:00Z'
  },
  {
    id: 'device-4',
    internal_id: '00000004',
    batch_id: 'batch-1',
    imei: '123456789012348',
    serial_number: 'SN123459',
    brand: 'Apple',
    model: 'iPhone 13',
    color: 'Red',
    storage_capacity: '128GB',
    status: 'final_qc',
    grade: 'ungraded',
    created_at: '2024-01-15T09:33:00Z'
  },
  {
    id: 'device-5',
    internal_id: '00000005',
    batch_id: 'batch-1',
    imei: '123456789012349',
    serial_number: 'SN123460',
    brand: 'Google',
    model: 'Pixel 6',
    color: 'Black',
    storage_capacity: '128GB',
    status: 'received',
    grade: 'ungraded',
    created_at: '2024-01-15T09:34:00Z'
  },
  // Batch 2 devices
  {
    id: 'device-6',
    internal_id: '00000006',
    batch_id: 'batch-2',
    imei: '223456789012345',
    serial_number: 'SN223456',
    brand: 'Apple',
    model: 'iPhone 12 Pro',
    color: 'Gold',
    storage_capacity: '256GB',
    status: 'initial_qc',
    grade: 'ungraded',
    created_at: '2024-01-16T10:30:00Z'
  },
  {
    id: 'device-7',
    internal_id: '00000007',
    batch_id: 'batch-2',
    imei: '223456789012346',
    serial_number: 'SN223457',
    brand: 'Samsung',
    model: 'Galaxy S22',
    color: 'Green',
    storage_capacity: '128GB',
    status: 'graded',
    grade: 'B',
    created_at: '2024-01-16T10:31:00Z'
  },
  {
    id: 'device-8',
    internal_id: '00000008',
    batch_id: 'batch-2',
    imei: '223456789012347',
    serial_number: 'SN223458',
    brand: 'OnePlus',
    model: '9 Pro',
    color: 'Silver',
    storage_capacity: '256GB',
    status: 'ready_to_ship',
    grade: 'A',
    created_at: '2024-01-16T10:32:00Z'
  },
  {
    id: 'device-9',
    internal_id: '00000009',
    batch_id: 'batch-2',
    imei: '223456789012348',
    serial_number: 'SN223459',
    brand: 'Samsung',
    model: 'Galaxy A52',
    color: 'Black',
    storage_capacity: '128GB',
    status: 'graded',
    grade: 'C',
    created_at: '2024-01-16T11:00:00Z'
  }
]

// Generate additional mock devices to reach ~60 total
function zeroPad(value: number, length = 8): string {
  return String(value).padStart(length, '0')
}

const brands = [
  { brand: 'Apple', models: ['iPhone 12', 'iPhone 12 Pro', 'iPhone 13'] },
  { brand: 'Samsung', models: ['Galaxy S21', 'Galaxy S22', 'Galaxy A52'] },
  { brand: 'Google', models: ['Pixel 6', 'Pixel 7'] },
  { brand: 'OnePlus', models: ['9 Pro', '10 Pro'] }
]

const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Silver', 'Gold']
const storages = ['64GB', '128GB', '256GB']
const statusCycle: Device['status'][] = [
  'received',
  'initial_qc',
  'awaiting_repair',
  'in_repair',
  'final_qc',
  'graded',
  'ready_to_ship'
]

const gradeForStatus = (status: Device['status'], index: number): Device['grade'] => {
  if (status === 'graded' || status === 'ready_to_ship') {
    const options: Device['grade'][] = ['A', 'B', 'C']
    // Use deterministic grade based on index to avoid hydration mismatch
    return options[index % options.length]
  }
  return 'ungraded'
}

const generatedDevices: Device[] = Array.from({ length: 51 }).map((_, idx) => {
  const i = idx + 10 // continue after existing 09
  const brandSet = brands[i % brands.length]
  const model = brandSet.models[i % brandSet.models.length]
  const color = colors[i % colors.length]
  const storage = storages[i % storages.length]
  const status = statusCycle[i % statusCycle.length]
  const grade = gradeForStatus(status, i)
  const batchId = ['batch-1', 'batch-2', 'batch-3'][i % 3]

  return {
    id: `device-${i}`,
    internal_id: zeroPad(i),
    batch_id: batchId,
    imei: String(300000000000000 + i),
    serial_number: `SN${300000 + i}`,
    brand: brandSet.brand,
    model,
    color,
    storage_capacity: storage,
    status,
    grade,
    created_at: `2024-01-18T10:${String(i % 60).padStart(2, '0')}:00Z`
  }
})

export const mockDevices: Device[] = [...mockDevicesBase, ...generatedDevices]

// =====================================================
// REPAIR JOBS
// =====================================================

export const mockRepairJobs: RepairJob[] = [
  {
    id: 'repair-1',
    device_id: 'device-2',
    device_internal_id: '00000002',
    device_model: 'iPhone 11',
    repair_type: 'housing_change',
    description: undefined,
    status: 'in_progress',
    assigned_to: 'user-3',
    assigned_to_name: 'Mike Technician',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'repair-2',
    device_id: 'device-2',
    device_internal_id: '00000002',
    device_model: 'iPhone 11',
    repair_type: 'battery_change',
    description: undefined,
    status: 'pending',
    assigned_to: undefined,
    assigned_to_name: undefined,
    created_at: '2024-01-15T10:01:00Z'
  },
  {
    id: 'repair-3',
    device_id: 'device-3',
    device_internal_id: '00000003',
    device_model: 'Galaxy S21',
    repair_type: 'glass_change',
    description: undefined,
    status: 'pending',
    assigned_to: undefined,
    assigned_to_name: undefined,
    created_at: '2024-01-15T11:00:00Z'
  },
  {
    id: 'repair-4',
    device_id: 'device-3',
    device_internal_id: '00000003',
    device_model: 'Galaxy S21',
    repair_type: 'other',
    description: 'Speaker replacement',
    status: 'pending',
    assigned_to: undefined,
    assigned_to_name: undefined,
    created_at: '2024-01-15T11:01:00Z'
  },
  {
    id: 'repair-5',
    device_id: 'device-4',
    device_internal_id: '00000004',
    device_model: 'iPhone 13',
    repair_type: 'software_update',
    description: undefined,
    status: 'completed',
    assigned_to: 'user-5',
    assigned_to_name: 'Tom Battery Pro',
    assigned_at: '2024-01-16T13:30:00Z',
    completed_at: '2024-01-16T14:00:00Z',
    created_at: '2024-01-16T13:00:00Z',
    completion_notes: 'iOS updated to latest version successfully'
  },
  {
    id: 'repair-6',
    device_id: 'device-5',
    device_internal_id: '00000005',
    device_model: 'iPhone 12 Pro',
    repair_type: 'battery_change',
    description: undefined,
    status: 'completed',
    assigned_to: 'user-7',
    assigned_to_name: 'Lisa L3 Tech',
    assigned_at: '2024-01-17T09:00:00Z',
    completed_at: '2024-01-17T11:30:00Z',
    created_at: '2024-01-17T08:30:00Z',
    completion_notes: 'Battery replaced successfully, tested at 100% capacity',
    parts_used: [
      {
        spare_part_id: 'part-1',
        part_name: 'iPhone 12 Battery',
        quantity_used: 1
      }
    ]
  },
  {
    id: 'repair-7',
    device_id: 'device-6',
    device_internal_id: '00000006',
    device_model: 'iPhone 11',
    repair_type: 'glass_change',
    description: undefined,
    status: 'pending',
    assigned_to: undefined,
    assigned_to_name: undefined,
    created_at: '2024-01-18T10:00:00Z'
  },
  {
    id: 'repair-8',
    device_id: 'device-7',
    device_internal_id: '00000007',
    device_model: 'Galaxy S22',
    repair_type: 'housing_change',
    description: undefined,
    status: 'in_progress',
    assigned_to: 'user-8',
    assigned_to_name: 'Mark L1 Specialist',
    assigned_at: '2024-01-18T11:00:00Z',
    created_at: '2024-01-18T09:00:00Z'
  },
  {
    id: 'repair-9',
    device_id: 'device-8',
    device_internal_id: '00000008',
    device_model: 'iPhone 14',
    repair_type: 'other',
    description: 'Camera module replacement',
    status: 'pending',
    assigned_to: undefined,
    assigned_to_name: undefined,
    created_at: '2024-01-18T12:00:00Z'
  },
  {
    id: 'repair-10',
    device_id: 'device-9',
    device_internal_id: '00000009',
    device_model: 'Galaxy S21',
    repair_type: 'glass_change',
    description: undefined,
    status: 'completed',
    assigned_to: 'user-9',
    assigned_to_name: 'Sarah L2 Pro',
    assigned_at: '2024-01-19T08:30:00Z',
    completed_at: '2024-01-19T12:00:00Z',
    created_at: '2024-01-19T08:00:00Z',
    completion_notes: 'Screen replaced, all touch functions verified',
    parts_used: [
      {
        spare_part_id: 'part-2',
        part_name: 'iPhone 11 Screen',
        quantity_used: 1
      }
    ]
  },
  {
    id: 'repair-11',
    device_id: 'device-10',
    device_internal_id: '00000010',
    device_model: 'iPhone 13 Pro',
    repair_type: 'battery_change',
    description: undefined,
    status: 'pending',
    assigned_to: undefined,
    assigned_to_name: undefined,
    created_at: '2024-01-19T14:00:00Z'
  },
  {
    id: 'repair-12',
    device_id: 'device-11',
    device_internal_id: '00000011',
    device_model: 'Galaxy S23',
    repair_type: 'housing_change',
    description: undefined,
    status: 'in_progress',
    assigned_to: 'user-8',
    assigned_to_name: 'Mark L1 Specialist',
    assigned_at: '2024-01-19T15:00:00Z',
    created_at: '2024-01-19T14:30:00Z'
  },
  {
    id: 'repair-13',
    device_id: 'device-12',
    device_internal_id: '00000012',
    device_model: 'iPhone 12',
    repair_type: 'software_update',
    description: undefined,
    status: 'pending',
    assigned_to: undefined,
    assigned_to_name: undefined,
    created_at: '2024-01-20T09:00:00Z'
  },
  {
    id: 'repair-14',
    device_id: 'device-13',
    device_internal_id: '00000013',
    device_model: 'Galaxy S22 Ultra',
    repair_type: 'other',
    description: 'Charging port repair',
    status: 'pending',
    assigned_to: undefined,
    assigned_to_name: undefined,
    created_at: '2024-01-20T10:30:00Z'
  },
  {
    id: 'repair-15',
    device_id: 'device-14',
    device_internal_id: '00000014',
    device_model: 'iPhone 14 Pro',
    repair_type: 'glass_change',
    description: undefined,
    status: 'in_progress',
    assigned_to: 'user-9',
    assigned_to_name: 'Sarah L2 Pro',
    assigned_at: '2024-01-20T11:00:00Z',
    created_at: '2024-01-20T10:00:00Z'
  }
]

// =====================================================
// QC CHECKS
// =====================================================

export const mockQCChecks: QCCheck[] = [
  {
    id: 'qc-1',
    device_id: 'device-1',
    device_internal_id: '00000001',
    device_model: 'iPhone 12',
    check_type: 'initial',
    overall_result: 'pass',
    grade_assigned: undefined,
    performed_by: 'user-6',
    performed_by_name: 'Emma Quality',
    performed_at: '2024-01-15T10:00:00Z',
    test_results: [
      { test_name: 'camera', result: 'pass' },
      { test_name: 'screen', result: 'pass' },
      { test_name: 'battery', result: 'pass' },
      { test_name: 'speaker', result: 'pass' },
      { test_name: 'microphone', result: 'pass' }
    ]
  },
  {
    id: 'qc-2',
    device_id: 'device-2',
    device_internal_id: '00000002',
    device_model: 'iPhone 11',
    check_type: 'initial',
    overall_result: 'fail',
    grade_assigned: undefined,
    performed_by: 'user-6',
    performed_by_name: 'Emma Quality',
    performed_at: '2024-01-15T10:30:00Z',
    test_results: [
      { test_name: 'camera', result: 'pass' },
      { test_name: 'screen', result: 'pass' },
      { test_name: 'battery', result: 'fail', notes: 'Battery health at 72%' },
      { test_name: 'speaker', result: 'pass' },
      { test_name: 'microphone', result: 'pass' },
      { test_name: 'housing', result: 'fail', notes: 'Scratches and dents' }
    ]
  },
  {
    id: 'qc-3',
    device_id: 'device-1',
    device_internal_id: '00000001',
    device_model: 'iPhone 12',
    check_type: 'final',
    overall_result: 'pass',
    grade_assigned: 'A',
    performed_by: 'user-6',
    performed_by_name: 'Emma Quality',
    performed_at: '2024-01-16T15:00:00Z',
    test_results: [
      { test_name: 'camera', result: 'pass' },
      { test_name: 'screen', result: 'pass' },
      { test_name: 'battery', result: 'pass' },
      { test_name: 'speaker', result: 'pass' },
      { test_name: 'microphone', result: 'pass' }
    ]
  }
]

// =====================================================
// SPARE PARTS
// =====================================================

export const mockSpareParts: SparePart[] = [
  {
    id: 'part-1',
    sku: 'BAT-IPH12',
    name: 'iPhone 12 Battery',
    category: 'battery',
    compatible_models: ['iPhone 12', 'iPhone 12 Pro'],
    quantity_in_stock: 45,
    minimum_stock_level: 10,
    unit_cost: 25.00,
    supplier_name: 'Parts Wholesale Inc'
  },
  {
    id: 'part-2',
    sku: 'SCR-IPH11',
    name: 'iPhone 11 Screen',
    category: 'screen',
    compatible_models: ['iPhone 11'],
    quantity_in_stock: 12,
    minimum_stock_level: 5,
    unit_cost: 85.00,
    supplier_name: 'Parts Wholesale Inc'
  },
  {
    id: 'part-3',
    sku: 'HSG-SAM-S21',
    name: 'Samsung S21 Housing',
    category: 'housing',
    compatible_models: ['Galaxy S21', 'Galaxy S21+'],
    quantity_in_stock: 8,
    minimum_stock_level: 5,
    unit_cost: 45.00,
    supplier_name: 'Mobile Traders'
  },
  {
    id: 'part-4',
    sku: 'BAT-SAM-S22',
    name: 'Samsung S22 Battery',
    category: 'battery',
    compatible_models: ['Galaxy S22'],
    quantity_in_stock: 3,
    minimum_stock_level: 10,
    unit_cost: 35.00,
    supplier_name: 'Parts Wholesale Inc'
  },
  {
    id: 'part-5',
    sku: 'SCR-IPH13',
    name: 'iPhone 13 Screen',
    category: 'screen',
    compatible_models: ['iPhone 13', 'iPhone 13 Pro'],
    quantity_in_stock: 20,
    minimum_stock_level: 8,
    unit_cost: 120.00,
    supplier_name: 'Parts Wholesale Inc'
  }
]

// =====================================================
// PRODUCTION METRICS
// =====================================================

export const mockProductionMetrics: ProductionMetrics = {
  today: {
    devices_received: 15,
    devices_in_repair: 8,
    devices_completed: 12,
    devices_shipped: 10,
    housing_changes: 3,
    glass_changes: 4,
    battery_changes: 5,
    software_updates: 6,
    other_repairs: 2,
    grade_a_count: 4,
    grade_b_count: 5,
    grade_c_count: 3
  },
  week: {
    devices_received: 80,
    devices_in_repair: 25,
    devices_completed: 65,
    devices_shipped: 60,
    housing_changes: 18,
    glass_changes: 22,
    battery_changes: 28,
    software_updates: 35,
    other_repairs: 12,
    grade_a_count: 20,
    grade_b_count: 30,
    grade_c_count: 15
  },
  month: {
    devices_received: 320,
    devices_in_repair: 45,
    devices_completed: 275,
    devices_shipped: 250,
    housing_changes: 75,
    glass_changes: 88,
    battery_changes: 112,
    software_updates: 140,
    other_repairs: 48,
    grade_a_count: 82,
    grade_b_count: 125,
    grade_c_count: 68
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function getDeviceById(id: string): Device | undefined {
  return mockDevices.find(d => d.id === id)
}

export function getDeviceByInternalId(internalId: string): Device | undefined {
  return mockDevices.find(d => d.internal_id === internalId)
}

export function getDeviceByIMEI(imei: string): Device | undefined {
  return mockDevices.find(d => d.imei === imei)
}

export function getRepairsByDeviceId(deviceId: string): RepairJob[] {
  return mockRepairJobs.filter(r => r.device_id === deviceId)
}

export function getQCChecksByDeviceId(deviceId: string): QCCheck[] {
  return mockQCChecks.filter(q => q.device_id === deviceId)
}

export function getBatchById(id: string): Batch | undefined {
  return mockBatches.find(b => b.id === id)
}

export function getUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id)
}

export function getTechniciansByLevel(level: 'L1' | 'L2' | 'L3'): User[] {
  return mockUsers.filter(u => u.role === 'technician' && u.technician_level === level)
}

export function getPendingRepairsByType(type: string): RepairJob[] {
  return mockRepairJobs.filter(r => r.repair_type === type && r.status === 'pending')
}

export function getLowStockParts(): SparePart[] {
  return mockSpareParts.filter(p => p.quantity_in_stock <= p.minimum_stock_level)
}