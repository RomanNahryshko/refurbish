import type { SupabaseClient } from '@supabase/supabase-js'
import { QCCheck, QCTestResult, DeviceGrade, QCCheckFilterFields } from '@/lib/types/business-types'

// Enhanced types for better type safety and validation
export interface CreateQCCheckData {
  device_id: string
  check_type: 'initial' | 'final'
  overall_result: 'not_tested' | 'pass' | 'fail'
  grade_assigned?: DeviceGrade
  notes?: string
  required_repairs?: string[] // Add required repairs for production metrics tracking
}

export interface CreateQCTestResultData {
  qc_check_id: string
  test_name: string
  test_result: 'not_tested' | 'pass' | 'fail'
  notes?: string
}

// Additional types for better structure
export interface QCCheckWithResults extends QCCheck {
  qc_test_results: QCTestResult[]
}

export interface QCCheckFilters {
  device_id?: string
  check_type?: 'initial' | 'final'
  overall_result?: 'not_tested' | 'pass' | 'fail'
  grade_assigned?: DeviceGrade
  date_from?: string
  date_to?: string
}

/**
 * QC Checks API with dependency injection pattern
 * Accepts Supabase client as parameter to avoid creating multiple clients
 */
export class QCChecksAPI {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get QC checks for a device
   */
  async getByDeviceId(deviceId: string): Promise<QCCheckWithResults[]> {
    try {
      const { data, error } = await this.supabase
        .from('qc_checks')
        .select(`
          *,
          qc_test_results(*)
        `)
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch QC checks for device: ${error.message}`)
      }

      return data as QCCheckWithResults[]
    } catch (error) {
      console.error('Error in getByDeviceId:', error)
      throw error
    }
  }

  /**
   * Get a single QC check by ID
   */
  async getById(id: string): Promise<QCCheckWithResults> {
    try {
      const { data, error } = await this.supabase
        .from('qc_checks')
        .select(`
          *,
          qc_test_results(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(`Failed to fetch QC check: ${error.message}`)
      }

      return data as QCCheckWithResults
    } catch (error) {
      console.error('Error in getById:', error)
      throw error
    }
  }

  /**
   * Create a new QC check
   */
  async create(qcData: CreateQCCheckData, testResults?: CreateQCTestResultData[]) {
    const requestBody = {
      ...qcData,
      test_results: testResults
    }
    
    const response = await fetch('/api/qc-checks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('API error:', errorData)
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    return result.data
  }

  /**
   * Update an existing QC check
   */
  async update(id: string, qcData: Partial<CreateQCCheckData>) {
    const { data, error } = await this.supabase
      .from('qc_checks')
      .update({
        ...qcData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        qc_test_results(*)
      `)
      .single()

    if (error) throw error
    return data as QCCheck & { qc_test_results: QCTestResult[] }
  }

  /**
   * Delete a QC check (soft delete)
   */
  async delete(id: string) {
    const { error } = await this.supabase
      .from('qc_checks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return true
  }

  /**
   * Get QC checks by type
   */
  async getByType(checkType: 'initial' | 'final') {
    const { data, error } = await this.supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .eq('check_type', checkType)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (QCCheck & { qc_test_results: QCTestResult[] })[]
  }

  /**
   * Get QC checks by result
   */
  async getByResult(result: 'not_tested' | 'pass' | 'fail') {
    const { data, error } = await this.supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .eq('overall_result', result)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (QCCheck & { qc_test_results: QCTestResult[] })[]
  }

  /**
   * Get QC checks by grade
   */
  async getByGrade(grade: DeviceGrade) {
    const { data, error } = await this.supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .eq('grade_assigned', grade)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (QCCheck & { qc_test_results: QCTestResult[] })[]
  }

  /**
   * Get QC checks by date range
   */
  async getByDateRange(startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (QCCheck & { qc_test_results: QCTestResult[] })[]
  }

  /**
   * Get QC checks by device and type
   */
  async getByDeviceAndType(deviceId: string, checkType: 'initial' | 'final') {
    const { data, error } = await this.supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .eq('device_id', deviceId)
      .eq('check_type', checkType)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (QCCheck & { qc_test_results: QCTestResult[] })[]
  }

  /**
   * Get QC checks by device and result
   */
  async getByDeviceAndResult(deviceId: string, result: 'not_tested' | 'pass' | 'fail') {
    const { data, error } = await this.supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .eq('device_id', deviceId)
      .eq('overall_result', result)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (QCCheck & { qc_test_results: QCTestResult[] })[]
  }

  /**
   * Get QC checks by device and grade
   */
  async getByDeviceAndGrade(deviceId: string, grade: DeviceGrade) {
    const { data, error } = await this.supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .eq('device_id', deviceId)
      .eq('grade_assigned', grade)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (QCCheck & { qc_test_results: QCTestResult[] })[]
  }

  /**
   * Get QC checks by device, type and result
   */
  async getByDeviceTypeAndResult(deviceId: string, checkType: 'initial' | 'final', result: 'not_tested' | 'pass' | 'fail') {
    const { data, error } = await this.supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .eq('device_id', deviceId)
      .eq('check_type', checkType)
      .eq('overall_result', result)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (QCCheck & { qc_test_results: QCTestResult[] })[]
  }

  /**
   * Get QC checks by device, type, result and grade
   */
  async getByDeviceTypeResultAndGrade(deviceId: string, checkType: 'initial' | 'final', result: 'not_tested' | 'pass' | 'fail', grade: DeviceGrade) {
    const { data, error } = await this.supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .eq('device_id', deviceId)
      .eq('check_type', checkType)
      .eq('overall_result', result)
      .eq('grade_assigned', grade)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (QCCheck & { qc_test_results: QCTestResult[] })[]
  }

  /**
   * Get QC checks by device, type, result, grade and date range
   */
  async getByDeviceTypeResultGradeAndDateRange(deviceId: string, checkType: 'initial' | 'final', result: 'not_tested' | 'pass' | 'fail', grade: DeviceGrade, startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .eq('device_id', deviceId)
      .eq('check_type', checkType)
      .eq('overall_result', result)
      .eq('grade_assigned', grade)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (QCCheck & { qc_test_results: QCTestResult[] })[]
  }

  /**
   * Get QC checks by device, type, result, grade, date range and all other fields
   */
  async getByAllFields(deviceId: string, checkType: 'initial' | 'final', result: 'not_tested' | 'pass' | 'fail', grade: DeviceGrade, startDate: string, endDate: string, allOtherFields: QCCheckFilterFields) {
    const { data, error } = await this.supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .eq('device_id', deviceId)
      .eq('check_type', checkType)
      .eq('overall_result', result)
      .eq('grade_assigned', grade)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('all_other_fields', allOtherFields)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (QCCheck & { qc_test_results: QCTestResult[] })[]
  }
}

/**
 * Factory function to create QCChecksAPI instance with client
 * This maintains backward compatibility while implementing dependency injection
 */
export function createQCChecksAPI(supabase: SupabaseClient): QCChecksAPI {
  return new QCChecksAPI(supabase)
}

/**
 * Legacy singleton instance for backward compatibility
 * @deprecated Use createQCChecksAPI() with dependency injection instead
 */
import { createSupabaseClient } from '@/lib/supabase/client'
export const qcChecksApi = new QCChecksAPI(createSupabaseClient()!)

