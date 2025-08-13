import { createClient } from '@/lib/supabase/client'
import { RepairJob, RepairType, RepairJobStatus, RepairPartsUsed } from '@/lib/types/business-types'

export interface CreateRepairJobData {
  device_id: string
  repair_type: RepairType
  description?: string // Required for 'other' type
  assigned_to?: string
  notes?: string
}

export interface UpdateRepairJobData {
  repair_type?: RepairType
  description?: string
  status?: RepairJobStatus
  assigned_to?: string
  assigned_at?: string
  completed_at?: string
  completion_notes?: string
}

export interface CreateRepairPartsUsedData {
  repair_job_id: string
  spare_part_id: string
  quantity_used: number
  notes?: string
}

export const repairJobsApi = {
  /**
   * Get all repair jobs
   */
  async getAll() {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('repair_jobs')
      .select(`
        *,
        device:devices(internal_id, imei, brand, model)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (RepairJob & {
      device: { internal_id: string; imei: string; brand?: string; model?: string }
    })[]
  },

  /**
   * Get repair jobs by device ID
   */
  async getByDeviceId(deviceId: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('repair_jobs')
      .select('*')
      .eq('device_id', deviceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as RepairJob[]
  },

  /**
   * Get repair jobs by technician
   */
  async getByTechnician(technicianId: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('repair_jobs')
      .select(`
        *,
        device:devices(internal_id, imei, brand, model)
      `)
      .eq('assigned_to', technicianId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (RepairJob & {
      device: { internal_id: string; imei: string; brand?: string; model?: string }
    })[]
  },

  /**
   * Get a single repair job by ID
   */
  async getById(id: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('repair_jobs')
      .select(`
        *,
        device:devices(internal_id, imei, brand, model)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data as RepairJob & {
      device: { internal_id: string; imei: string; brand?: string; model?: string }
    }
  },

  /**
   * Create a new repair job
   */
  async create(repairJobData: CreateRepairJobData, createdBy: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // Validate description for 'other' repair type
    if (repairJobData.repair_type === 'other' && !repairJobData.description) {
      throw new Error('Description is required for "other" repair type')
    }

    const { data, error } = await supabase
      .from('repair_jobs')
      .insert({
        ...repairJobData,
        status: 'pending' as RepairJobStatus,
        created_by: createdBy,
        assigned_at: repairJobData.assigned_to ? new Date().toISOString() : undefined
      })
      .select()
      .single()

    if (error) throw error
    return data as RepairJob
  },

  /**
   * Update an existing repair job
   */
  async update(id: string, repairJobData: UpdateRepairJobData) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // Validate description for 'other' repair type
    if (repairJobData.repair_type === 'other' && !repairJobData.description) {
      throw new Error('Description is required for "other" repair type')
    }

    const { data, error } = await supabase
      .from('repair_jobs')
      .update({
        ...repairJobData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as RepairJob
  },

  /**
   * Delete a repair job (soft delete)
   */
  async delete(id: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { error } = await supabase
      .from('repair_jobs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return true
  },

  /**
   * Get parts used in a repair job
   */
  async getPartsUsed(repairJobId: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('repair_parts_used')
      .select(`
        *,
        spare_part:spare_parts(name, sku)
      `)
      .eq('repair_job_id', repairJobId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as (RepairPartsUsed & {
      spare_part: { name: string; sku: string }
    })[]
  },

  /**
   * Record parts usage in a repair job
   */
  async recordPartsUsage(partsData: CreateRepairPartsUsedData[], recordedBy: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const partsToRecord = partsData.map(part => ({
      ...part,
      recorded_by: recordedBy,
      recorded_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('repair_parts_used')
      .insert(partsToRecord)
      .select()

    if (error) throw error
    return data as RepairPartsUsed[]
  }
}
