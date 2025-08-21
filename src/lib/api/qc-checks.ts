import { createSupabaseClient } from '@/lib/supabase/client'
import { QCCheck, QCTestResult, DeviceGrade } from '@/lib/types/business-types'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface CreateQCCheckData {
  device_id: string
  check_type: 'initial' | 'final'
  overall_result: 'not_tested' | 'pass' | 'fail'
  grade_assigned?: DeviceGrade
  notes?: string
}

export interface CreateQCTestResultData {
  qc_check_id: string
  test_name: string
  test_result: 'not_tested' | 'pass' | 'fail'
  notes?: string
}

/**
 * Optimized QC Checks API with singleton Supabase client
 */
class QCChecksAPI {
  private client: SupabaseClient | null = null

  private getClient(): SupabaseClient {
    if (!this.client) {
      this.client = createSupabaseClient()
    }
    
    if (!this.client) {
      throw new Error('Supabase client not initialized')
    }
    
    return this.client
  }
  /**
   * Get QC checks for a device
   */
  async getByDeviceId(deviceId: string) {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (QCCheck & { qc_test_results: QCTestResult[] })[]
  }

  /**
   * Get a single QC check by ID
   */
  async getById(id: string) {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('qc_checks')
      .select(`
        *,
        qc_test_results(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as QCCheck & { qc_test_results: QCTestResult[] }
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
  async update(id: string, qcData: Partial<CreateQCCheckData>, testResults?: CreateQCTestResultData[]) {
    const supabase = this.getClient()

    // Update QC check
    const { error: qcError } = await supabase
      .from('qc_checks')
      .update({
        ...qcData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (qcError) throw qcError

    // If test results are provided, update them
    if (testResults !== undefined) {
      // Delete existing test results
      const { error: deleteError } = await supabase
        .from('qc_test_results')
        .delete()
        .eq('qc_check_id', id)

      if (deleteError) throw deleteError

      // Insert new test results if any
      if (testResults.length > 0) {
        const { error: testError } = await supabase
          .from('qc_test_results')
          .insert(testResults)

        if (testError) throw testError
      }
    }

    // Return the updated QC check with test results
    return this.getById(id)
  }

  /**
   * Delete a QC check
   */
  async delete(id: string) {
    const supabase = this.getClient()

    // Delete test results first (due to foreign key constraint)
    const { error: testError } = await supabase
      .from('qc_test_results')
      .delete()
      .eq('qc_check_id', id)

    if (testError) throw testError

    // Delete QC check
    const { error } = await supabase
      .from('qc_checks')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  /**
   * Get QC test results for a specific check
   */
  async getTestResults(qcCheckId: string) {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('qc_test_results')
      .select('*')
      .eq('qc_check_id', qcCheckId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as QCTestResult[]
  }

  /**
   * Add a single test result
   */
  async addTestResult(testResult: CreateQCTestResultData) {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('qc_test_results')
      .insert(testResult)
      .select()
      .single()

    if (error) throw error
    return data as QCTestResult
  }
}

// Export singleton instance
export const qcChecksApi = new QCChecksAPI()
