import { createClient } from '@/lib/supabase/client'

export interface QCCheck {
  id: string
  device_id: string
  check_type: 'initial' | 'final'
  overall_result: 'not_tested' | 'pass' | 'fail'
  grade_assigned?: 'A' | 'B' | 'C'
  performed_by: string
  performed_at: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface CreateQCCheckData {
  device_id: string
  check_type: 'initial' | 'final'
  overall_result: 'not_tested' | 'pass' | 'fail'
  grade_assigned?: 'A' | 'B' | 'C'
  notes?: string
}

export interface QCRepairTask {
  id: string
  qc_check_id: string
  repair_task_id: string
  notes?: string
  created_at: string
}

export const qcChecksApi = {
  /**
   * Get QC checks for a device
   */
  async getByDeviceId(deviceId: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('qc_checks')
      .select(`
        *,
        repair_tasks:qc_repair_tasks(
          id,
          repair_task_id,
          notes
        )
      `)
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (QCCheck & { repair_tasks: QCRepairTask[] })[]
  },

  /**
   * Get a single QC check by ID
   */
  async getById(id: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('qc_checks')
      .select(`
        *,
        repair_tasks:qc_repair_tasks(
          id,
          repair_task_id,
          notes
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as QCCheck & { repair_tasks: QCRepairTask[] }
  },

  /**
   * Create a new QC check
   */
  async create(qcData: CreateQCCheckData, repairTaskIds?: string[]) {
    console.log('Making API call to /api/qc-checks with data:', { qcData, repairTaskIds })
    
    const requestBody = {
      ...qcData,
      repair_task_ids: repairTaskIds
    }
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2))
    
    const response = await fetch('/api/qc-checks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('API response status:', response.status)
    console.log('API response headers:', response.headers)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('API error:', errorData)
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log('API success result:', result)
    return result.data
  },

  /**
   * Update an existing QC check
   */
  async update(id: string, qcData: Partial<CreateQCCheckData>, repairTaskIds?: string[]) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // Update QC check
    const { data: qcCheck, error: qcError } = await supabase
      .from('qc_checks')
      .update({
        ...qcData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (qcError) throw qcError

    // If repair tasks are provided, update them
    if (repairTaskIds !== undefined) {
      // Delete existing repair tasks
      const { error: deleteError } = await supabase
        .from('qc_repair_tasks')
        .delete()
        .eq('qc_check_id', id)

      if (deleteError) throw deleteError

      // Insert new repair tasks if any
      if (repairTaskIds.length > 0) {
        const repairTaskRecords = repairTaskIds.map(repairTaskId => ({
          qc_check_id: id,
          repair_task_id: repairTaskId
        }))

        const { error: repairError } = await supabase
          .from('qc_repair_tasks')
          .insert(repairTaskRecords)

        if (repairError) throw repairError
      }
    }

    // Return the updated QC check with repair tasks
    return this.getById(id)
  },

  /**
   * Delete a QC check
   */
  async delete(id: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // Delete repair tasks first (due to foreign key constraint)
    const { error: repairError } = await supabase
      .from('qc_repair_tasks')
      .delete()
      .eq('qc_check_id', id)

    if (repairError) throw repairError

    // Delete QC check
    const { error } = await supabase
      .from('qc_checks')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }
}
