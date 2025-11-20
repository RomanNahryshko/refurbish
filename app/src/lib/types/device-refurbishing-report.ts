export interface ReportData {
  devicesCount: number
  jobsCount: number
  byTechnician: TechnicianStats[]
  byModelBrand: ModelBrandStats[]
  byRepairType: RepairTypeStats[]
  byBatch: BatchStats[]
  dateFrom: string
  dateTo: string
  availableBrands?: string[]
  availableModelsByBrand?: Record<string, string[]>
}

export interface TechnicianStats {
  technicianId: string
  technicianName: string
  technicianLevel: string
  jobs: number
  devices: number
}

export interface ModelBrandStats {
  brand: string
  model: string
  jobs: number
}

export interface RepairTypeStats {
  repairType: string
  jobs: number
}

export interface BatchStats {
  batchId: string
  batchNumber: string
  devices: number
  jobs: number
}

export interface Technician {
  id: string
  full_name: string
  technician_level: string | null
}

