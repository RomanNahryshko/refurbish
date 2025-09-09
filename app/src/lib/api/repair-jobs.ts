import type { SupabaseClient } from '@supabase/supabase-js'
import { RepairJob, RepairType, RepairJobStatus, RepairPartsUsed } from '@/lib/types/business-types'

// Enhanced types for better type safety and validation
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

// Additional types for better structure
export interface RepairJobWithDevice extends RepairJob {
  device: {
    internal_id: string
    imei: string
    brand?: string
    model?: string
  }
}

export interface RepairJobWithDetails extends RepairJob {
  device: {
    internal_id: string
    imei: string
    brand?: string
    model?: string
  }
  assigned_technician?: {
    full_name: string
    role: string
  }
}

/**
 * Repair Jobs API with dependency injection pattern
 * Accepts Supabase client as parameter to avoid creating multiple clients
 */
export class RepairJobsAPI {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all repair jobs
   */
  async getAll(): Promise<RepairJobWithDevice[]> {
    try {
      console.log('RepairJobsAPI.getAll: Starting query...')
      
      const { data, error } = await this.supabase
        .from('repair_jobs')
        .select(`
          *,
          device:devices(internal_id, imei, brand, model)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('RepairJobsAPI.getAll: Database error:', error)
        throw new Error(`Failed to fetch repair jobs: ${error.message}`)
      }

      console.log('RepairJobsAPI.getAll: Query successful, found', data?.length || 0, 'repair jobs')
      return data as RepairJobWithDevice[]
    } catch (error) {
      console.error('RepairJobsAPI.getAll: Exception:', error)
      throw error
    }
  }

  /**
   * Get repair jobs by device ID
   */
  async getByDeviceId(deviceId: string): Promise<RepairJob[]> {
    try {
      const { data, error } = await this.supabase
        .from('repair_jobs')
        .select('*')
        .eq('device_id', deviceId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch repair jobs for device: ${error.message}`)
      }

      return data as RepairJob[]
    } catch (error) {
      console.error('Error in getByDeviceId:', error)
      throw error
    }
  }

  /**
   * Get repair jobs by technician
   */
  async getByTechnician(technicianId: string): Promise<RepairJobWithDevice[]> {
    try {
      const { data, error } = await this.supabase
        .from('repair_jobs')
        .select(`
          *,
          device:devices(internal_id, imei, brand, model)
        `)
        .eq('assigned_to', technicianId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch repair jobs for technician: ${error.message}`)
      }

      return data as RepairJobWithDevice[]
    } catch (error) {
      console.error('Error in getByTechnician:', error)
      throw error
    }
  }

  /**
   * Get a single repair job by ID
   */
  async getById(id: string) {


    const { data, error } = await this.supabase
      .from('repair_jobs')
      .select(`
        *,
        device:devices(internal_id, imei, brand, model),
        spare_parts_used:repair_parts_used(
          id,
          quantity_used,
          notes,
          spare_part:spare_parts(
            id,
            name,
            sku,
            description
          )
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data as RepairJob & {
      device: { internal_id: string; imei: string; brand?: string; model?: string }
      spare_parts_used: (RepairPartsUsed & {
        spare_part: { id: string; name: string; sku: string; description?: string }
      })[]
    }
  }

  /**
   * Create a new repair job
   */
  async create(repairJobData: CreateRepairJobData) {


    const { data, error } = await this.supabase
      .from('repair_jobs')
      .insert([repairJobData])
      .select()
      .single()

    if (error) throw error
    return data as RepairJob
  }

  /**
   * Update an existing repair job
   */
  async update(id: string, updateData: UpdateRepairJobData) {


    const { data, error } = await this.supabase
      .from('repair_jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as RepairJob
  }

  /**
   * Delete a repair job (soft delete)
   */
  async delete(id: string) {


    const { error } = await this.supabase
      .from('repair_jobs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return true
  }

  /**
   * Start a repair job (update status and assigned_at)
   */
  async startRepair(id: string, technicianId: string) {


    const { data, error } = await this.supabase
      .from('repair_jobs')
      .update({
        status: 'in_progress' as RepairJobStatus,
        assigned_to: technicianId,
        assigned_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as RepairJob
  }

  /**
   * Complete a repair job
   */
  async completeRepair(id: string, completionNotes?: string) {


    const { data, error } = await this.supabase
      .from('repair_jobs')
      .update({
        status: 'completed' as RepairJobStatus,
        completed_at: new Date().toISOString(),
        completion_notes: completionNotes
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as RepairJob
  }

  /**
   * Add spare parts used in a repair
   */
  async addSparePartsUsed(partsData: CreateRepairPartsUsedData[]) {


    const { data, error } = await this.supabase
      .from('repair_parts_used')
      .insert(partsData)
      .select()

    if (error) throw error
    return data as RepairPartsUsed[]
  }

  /**
   * Get spare parts used for a repair job
   */
  async getSparePartsUsed(repairJobId: string) {


    const { data, error } = await this.supabase
      .from('repair_parts_used')
      .select(`
        *,
        spare_part:spare_parts(
          id,
          name,
          sku,
          description
        )
      `)
      .eq('repair_job_id', repairJobId)
      .is('deleted_at', null)

    if (error) throw error
    return data as (RepairPartsUsed & {
      spare_part: { id: string; name: string; sku: string; description?: string }
    })[]
  }

  /**
   * Get repair jobs by status
   */
  async getByStatus(status: RepairJobStatus) {


    const { data, error } = await this.supabase
      .from('repair_jobs')
      .select(`
        *,
        device:devices(internal_id, imei, brand, model)
      `)
      .eq('status', status)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (RepairJob & {
      device: { internal_id: string; imei: string; brand?: string; model?: string }
    })[]
  }

  /**
   * Get repair jobs by repair type
   */
  async getByRepairType(repairType: RepairType) {


    const { data, error } = await this.supabase
      .from('repair_jobs')
      .select(`
        *,
        device:devices(internal_id, imei, brand, model)
      `)
      .eq('repair_type', repairType)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (RepairJob & {
      device: { internal_id: string; imei: string; brand?: string; model?: string }
    })[]
  }

  /**
   * Get repair jobs statistics
   */
  async getStatistics() {


    const { data, error } = await this.supabase
      .from('repair_jobs')
      .select('status, created_at')
      .is('deleted_at', null)

    if (error) throw error

    const stats = {
      total: data.length,
      pending: data.filter(job => job.status === 'pending').length,
      inProgress: data.filter(job => job.status === 'in_progress').length,
      completed: data.filter(job => job.status === 'completed').length,
      cancelled: data.filter(job => job.status === 'cancelled').length
    }

    return stats
  }

  /**
   * Get repair jobs with pagination
   */
  async getWithPagination(page: number = 1, limit: number = 10, filters?: {
    status?: RepairJobStatus
    repairType?: RepairType
    technicianId?: string
  }) {


    let query = this.supabase
      .from('repair_jobs')
      .select(`
        *,
        device:devices(internal_id, imei, brand, model)
      `, { count: 'exact' })
      .is('deleted_at', null)

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.repairType) {
      query = query.eq('repair_type', filters.repairType)
    }
    if (filters?.technicianId) {
      query = query.eq('assigned_to', filters.technicianId)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return {
      data: data as (RepairJob & {
        device: { internal_id: string; imei: string; brand?: string; model?: string }
      })[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  /**
   * Bulk update repair jobs
   */
  async bulkUpdate(updates: Array<{ id: string; data: UpdateRepairJobData }>) {


    const { data, error } = await this.supabase
      .from('repair_jobs')
      .upsert(
        updates.map(update => ({
          id: update.id,
          ...update.data,
          updated_at: new Date().toISOString()
        }))
      )
      .select()

    if (error) throw error
    return data as RepairJob[]
  }

  /**
   * Get repair jobs for a specific date range
   */
  async getByDateRange(startDate: string, endDate: string) {


    const { data, error } = await this.supabase
      .from('repair_jobs')
      .select(`
        *,
        device:devices(internal_id, imei, brand, model)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (RepairJob & {
      device: { internal_id: string; imei: string; brand?: string; model?: string }
    })[]
  }

  /**
   * Start a repair job (assign technician and update status)
   */
  async startRepairJob(repairJobId: string, assignedTo?: string) {
    // First, update the repair job status and assignment
    const { data: repairJob, error: repairError } = await this.supabase
      .from('repair_jobs')
      .update({
        status: 'in_progress',
        assigned_to: assignedTo,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', repairJobId)
      .select()
      .single()

    if (repairError) throw repairError

    // Then, update the device status to 'in_repair'
    const { error: deviceError } = await this.supabase
      .from('devices')
      .update({
        status: 'in_repair',
        updated_at: new Date().toISOString()
      })
      .eq('id', repairJob.device_id)

    if (deviceError) throw deviceError

    // Record the status change in device_status_history
    const { error: historyError } = await this.supabase
      .from('device_status_history')
      .insert({
        device_id: repairJob.device_id,
        old_status: 'awaiting_repair',
        new_status: 'in_repair',
        changed_by: assignedTo,
        notes: `Repair started by technician`
      })

    if (historyError) throw historyError

    return repairJob
  }

  /**
   * Complete a repair job (mark as completed)
   * Note: Device status change to final_qc is handled by the server API endpoint
   * This function only updates the repair job status
   */
  async completeRepairJob(repairJobId: string, completionData: {
    completion_notes?: string
    parts_used?: RepairPartsUsed[]
  }) {
    // Only update the repair job status to completed
    // The server API endpoint will handle device status change and QC logic
    const { data: repairJob, error: repairError } = await this.supabase
      .from('repair_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_notes: completionData.completion_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', repairJobId)
      .select()
      .single()

    if (repairError) throw repairError

    // If parts were used, record them
    if (completionData.parts_used && completionData.parts_used.length > 0) {
      const { error: partsError } = await this.supabase
        .from('repair_parts_used')
        .insert(completionData.parts_used)

      if (partsError) throw partsError
    }

    return repairJob
  }
}

/**
 * Factory function to create RepairJobsAPI instance with client
 * This maintains backward compatibility while implementing dependency injection
 */
export function createRepairJobsAPI(supabase: SupabaseClient): RepairJobsAPI {
  return new RepairJobsAPI(supabase)
}

/**
 * Legacy singleton instance for backward compatibility
 * @deprecated Use createRepairJobsAPI() with dependency injection instead
 */
import { createSupabaseClient } from '@/lib/supabase/client'
export const repairJobsApi = new RepairJobsAPI(createSupabaseClient()!)
