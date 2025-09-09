import type { SupabaseClient } from '@supabase/supabase-js'
import { Device, DeviceStatus, DeviceGrade, DrPhoneData, DeviceStatusUpdateData } from '@/lib/types/business-types'

// Enhanced types for better type safety and structure
export interface CreateDeviceData {
  batch_id: string
  imei: string
  serial_number?: string
  brand?: string
  model?: string
  color?: string
  storage_capacity?: string
  dr_phone_data?: DrPhoneData
  notes?: string
}

export interface UpdateDeviceData extends Partial<CreateDeviceData> {
  status?: DeviceStatus
  grade?: DeviceGrade
  qc_notes?: string
  repair_notes?: string
}

export interface DeviceWithBatch extends Device {
  batch: {
    id: string
    batch_number: string
    supplier: {
      id: string
      name: string
    } | null
  } | null
}

export interface DeviceFilters {
  batch_id?: string
  status?: DeviceStatus
  grade?: DeviceGrade
  brand?: string
  model?: string
  search?: string
  date_from?: string
  date_to?: string
}

/**
 * Devices API with dependency injection pattern
 * Accepts Supabase client as parameter to avoid creating multiple clients
 */
export class DevicesAPI {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all devices
   */
  async getAll(): Promise<DeviceWithBatch[]> {
    try {
      const { data, error } = await this.supabase
        .from('devices')
        .select(`
          *,
          batch:batches(
            id,
            batch_number,
            supplier:suppliers(
              id,
              name
            )
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch devices: ${error.message}`)
      }

      return data as DeviceWithBatch[]
    } catch (error) {
      console.error('Error in getAll:', error)
      throw error
    }
  }

  /**
   * Get devices by batch ID
   */
  async getByBatchId(batchId: string): Promise<DeviceWithBatch[]> {
    try {
      const { data, error } = await this.supabase
        .from('devices')
        .select(`
          *,
          batch:batches(
            id,
            batch_number,
            supplier:suppliers(
              id,
              name
            )
          )
        `)
        .eq('batch_id', batchId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch devices for batch: ${error.message}`)
      }

      return data as DeviceWithBatch[]
    } catch (error) {
      console.error('Error in getByBatchId:', error)
      throw error
    }
  }

  /**
   * Get a single device by ID
   */
  async getById(id: string): Promise<DeviceWithBatch> {
    try {
      const { data, error } = await this.supabase
        .from('devices')
        .select(`
          *,
          batch:batches(
            id,
            batch_number,
            supplier:suppliers(
              id,
              name
            )
          )
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      if (error) {
        throw new Error(`Failed to fetch device: ${error.message}`)
      }

      return data as DeviceWithBatch
    } catch (error) {
      console.error('Error in getById:', error)
      throw error
    }
  }

  /**
   * Get a single device by internal ID
   */
  async getByInternalId(internalId: string) {
    const { data, error } = await this.supabase
      .from('devices')
      .select(`
        *,
        batch:batches(
          id,
          batch_number,
          supplier:suppliers(name),
          received_date,
          notes
        )
      `)
      .eq('internal_id', internalId)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a new device
   */
  async create(deviceData: CreateDeviceData) {
    const { data, error } = await this.supabase
      .from('devices')
      .insert(deviceData)
      .select('*')
      .single()

    if (error) throw error
    return data as Device
  }

  /**
   * Update an existing device
   */
  async update(id: string, deviceData: Partial<Device>) {
    const { data, error } = await this.supabase
      .from('devices')
      .update({
        ...deviceData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as Device
  }

  /**
   * Delete a device (soft delete)
   */
  async delete(id: string) {
    const { error } = await this.supabase
      .from('devices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return true
  }

  /**
   * Update device status
   */
  async updateStatus(id: string, status: DeviceStatus, grade?: DeviceGrade) {
    const updateData: DeviceStatusUpdateData = { 
      status, 
      updated_at: new Date().toISOString() 
    }
    
    if (grade) {
      updateData.grade = grade
    }

    const { data, error } = await this.supabase
      .from('devices')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as Device
  }

  /**
   * Get devices by status
   */
  async getByStatus(status: DeviceStatus) {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .eq('status', status)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Device[]
  }

  /**
   * Get devices by grade
   */
  async getByGrade(grade: DeviceGrade) {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .eq('grade', grade)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Device[]
  }

  /**
   * Get devices by brand and model
   */
  async getByBrandAndModel(brand: string, model: string) {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .eq('brand', brand)
      .eq('model', model)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Device[]
  }

  /**
   * Get devices by IMEI
   */
  async getByImei(imei: string) {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .eq('imei', imei)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data as Device
  }

  /**
   * Get devices by serial number
   */
  async getBySerialNumber(serialNumber: string) {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .eq('serial_number', serialNumber)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data as Device
  }

  /**
   * Bulk create devices
   */
  async bulkCreate(devicesData: CreateDeviceData[]) {
    const { data, error } = await this.supabase
      .from('devices')
      .insert(devicesData)
      .select('*')

    if (error) throw error
    return data as Device[]
  }

  /**
   * Bulk update devices
   */
  async bulkUpdate(updates: { id: string; data: Partial<Device> }[]) {
    const results = []
    
    for (const update of updates) {
      const result = await this.update(update.id, update.data)
      results.push(result)
    }
    
    return results
  }

  /**
   * Get device count by status
   */
  async getCountByStatus(status: DeviceStatus) {
    const { count, error } = await this.supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
      .is('deleted_at', null)

    if (error) throw error
    return count || 0
  }

  /**
   * Get device count by batch
   */
  async getCountByBatch(batchId: string) {
    const { count, error } = await this.supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', batchId)
      .is('deleted_at', null)

    if (error) throw error
    return count || 0
  }

  /**
   * Get device status history
   */
  async getDeviceStatusHistory(deviceId: string) {
    const { data, error } = await this.supabase
      .from('device_status_history')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get devices in final QC status
   */
  async getDevicesForFinalQC() {
    const { data, error } = await this.supabase
      .from('devices')
      .select(`
        *,
        batch:batches(
          id,
          batch_number,
          supplier:suppliers(
            id,
            name
          )
        )
      `)
      .eq('status', 'final_qc')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get QC checks for devices
   */
  async getQCChecks(deviceIds: string[]) {
    const { data, error } = await this.supabase
      .from('qc_checks')
      .select('*')
      .in('device_id', deviceIds)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }


}

/**
 * Factory function to create DevicesAPI instance with client
 * This maintains backward compatibility while implementing dependency injection
 */
export function createDevicesAPI(supabase: SupabaseClient): DevicesAPI {
  return new DevicesAPI(supabase)
}

/**
 * Legacy singleton instance for backward compatibility
 * @deprecated Use createDevicesAPI() with dependency injection instead
 */
import { createSupabaseClient } from '@/lib/supabase/client'
export const devicesApi = new DevicesAPI(createSupabaseClient()!)
