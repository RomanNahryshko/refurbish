import { createClient } from '@/lib/supabase/client'

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
  status: 'received' | 'in_repair' | 'qc_passed' | 'qc_failed' | 'shipped'
  grade?: 'A' | 'B' | 'C' | 'ungraded'
  dr_phone_data?: any
  dr_phone_imported_at?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at?: string
  deleted_at?: string
}

export interface CreateDeviceData {
  batch_id: string
  imei: string
  serial_number?: string
  brand?: string
  model?: string
  color?: string
  storage_capacity?: string
  dr_phone_data?: any
  notes?: string
}

export const devicesApi = {
  /**
   * Get all devices
   */
  async getAll() {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Device[]
  },

  /**
   * Get devices by batch ID
   */
  async getByBatchId(batchId: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('batch_id', batchId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Device[]
  },

  /**
   * Get a single device by ID
   */
  async getById(id: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data as Device
  },

  /**
   * Create a new device
   */
  async create(deviceData: CreateDeviceData) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // Generate internal ID (8-digit format)
    const timestamp = Date.now().toString()
    const internalId = timestamp.slice(-8)

    const { data, error } = await supabase
      .from('devices')
      .insert({
        ...deviceData,
        internal_id: internalId,
        status: 'received',
        grade: 'ungraded',
        dr_phone_imported_at: deviceData.dr_phone_data ? new Date().toISOString() : undefined
      })
      .select()
      .single()

    if (error) throw error
    return data as Device
  },

  /**
   * Create multiple devices from imported data
   */
  async createFromImport(batchId: string, devices: Array<{
    imei: string
    brand?: string
    model?: string
    serial_number?: string
    dr_phone_data?: any
  }>) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const devicesToCreate = devices.map(device => ({
      batch_id: batchId,
      imei: device.imei,
      brand: device.brand,
      model: device.model,
      serial_number: device.serial_number,
      dr_phone_data: device.dr_phone_data,
      status: 'received' as const,
      grade: 'ungraded' as const,
      dr_phone_imported_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('devices')
      .insert(devicesToCreate)
      .select()

    if (error) throw error
    return data as Device[]
  },

  /**
   * Update a device
   */
  async update(id: string, deviceData: Partial<CreateDeviceData>) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('devices')
      .update({
        ...deviceData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Device
  },

  /**
   * Delete a device (soft delete)
   */
  async delete(id: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { error } = await supabase
      .from('devices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return true
  }
}


