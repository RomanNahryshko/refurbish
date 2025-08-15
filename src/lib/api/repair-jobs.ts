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
  },

  /**
   * Start a repair job and update device status
   */
  async startRepairJob(id: string, assignedTo?: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // Get current user for assigned_by field
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // First, get the repair job to check device_id
    const { data: repairJob, error: fetchError } = await supabase
      .from('repair_jobs')
      .select('device_id, repair_type')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Validate device_id
    if (!repairJob.device_id) {
      throw new Error('Repair job has no device_id')
    }

    // Update repair job status to in_progress
    const { data, error } = await supabase
      .from('repair_jobs')
      .update({
        status: 'in_progress' as RepairJobStatus,
        assigned_to: assignedTo || user.id,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Update device status to in_repair
    const { error: deviceUpdateError } = await supabase
      .from('devices')
      .update({ 
        status: 'in_repair'
      })
      .eq('id', repairJob.device_id)

    if (deviceUpdateError) {
      console.error('Failed to update device status:', deviceUpdateError)
      // Don't fail the entire request if device update fails
    }

    // Record device status change in history
    const { error: historyError } = await supabase
      .from('device_status_history')
      .insert({
        device_id: repairJob.device_id,
        old_status: 'awaiting_repair',
        new_status: 'in_repair',
        changed_by: user.id,
        notes: `Device repair started - ${repairJob.repair_type}`
      })

    if (historyError) {
      console.error('Failed to record device status history:', historyError)
      // Don't fail the entire request if history recording fails
    }

    return data as RepairJob
  },

  /**
   * Complete a repair job and handle device status transition
   */
  async completeRepairJob(id: string, completionData: {
    completion_notes?: string
    parts_used?: CreateRepairPartsUsedData[]
  }) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // Get current user for recorded_by field
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // First, get the repair job to check device_id
    const { data: repairJob, error: fetchError } = await supabase
      .from('repair_jobs')
      .select('device_id, repair_type')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Update repair job status to completed
    const { data, error } = await supabase
      .from('repair_jobs')
      .update({
        status: 'completed' as RepairJobStatus,
        completed_at: new Date().toISOString(),
        completion_notes: completionData.completion_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Record parts usage if provided
    if (completionData.parts_used && completionData.parts_used.length > 0) {
      const partsToRecord = completionData.parts_used.map(part => ({
        ...part,
        recorded_by: user.id,
        recorded_at: new Date().toISOString()
      }))

      const { error: partsError } = await supabase
        .from('repair_parts_used')
        .insert(partsToRecord)

      if (partsError) {
        console.error('Error recording parts usage:', partsError)
        // Don't fail the entire request if parts recording fails
      }
    }

    // Check if all repairs for this device are completed
    const { data: pendingRepairs, error: pendingError } = await supabase
      .from('repair_jobs')
      .select('id, status')
      .eq('device_id', repairJob.device_id)
      .in('status', ['pending', 'in_progress'])

    if (pendingError) {
      console.error('Error checking pending repairs:', pendingError)
      // Don't fail the entire request if this check fails
    } else if (!pendingRepairs || pendingRepairs.length === 0) {
      // All repairs completed, send device to final QC
      await this.sendDeviceToFinalQC(supabase, repairJob.device_id, user.id, repairJob.repair_type)
    }

    return data as RepairJob
  },

  /**
   * Send device to final QC after all repairs are completed
   */
  async sendDeviceToFinalQC(
    supabase: any, 
    deviceId: string, 
    userId: string, 
    repairType: string
  ) {
    // Update device status to final_qc
    const { error: deviceUpdateError } = await supabase
      .from('devices')
      .update({ 
        status: 'final_qc'
      })
      .eq('id', deviceId)

    if (deviceUpdateError) {
      console.error('Error updating device status to final_qc:', deviceUpdateError)
      // Don't fail the entire request if device update fails
    }

    // Create QC check record for final quality control
    const { error: qcCheckError } = await supabase
      .from('qc_checks')
      .insert({
        device_id: deviceId,
        check_type: 'final',
        overall_result: 'not_tested',
        performed_by: userId,
        notes: `Device sent to final QC after completing ${repairType} repair`
      })

    if (qcCheckError) {
      console.error('Error creating QC check record:', qcCheckError)
      // Don't fail the entire request if QC check creation fails
    }

    // Record device status change in history
    const { error: historyError } = await supabase
      .from('device_status_history')
      .insert({
        device_id: deviceId,
        old_status: 'in_repair',
        new_status: 'final_qc',
        changed_by: userId,
        notes: `Device sent to final QC after completing ${repairType} repair`
      })

    if (historyError) {
      console.error('Error recording device status history:', historyError)
      // Don't fail the entire request if history recording fails
    }
  },

  /**
   * Check if all repairs for a device are completed
   */
  async areAllRepairsCompleted(deviceId: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('repair_jobs')
      .select('id, status')
      .eq('device_id', deviceId)
      .in('status', ['pending', 'in_progress'])

    if (error) throw error
    return !data || data.length === 0
  }
}
