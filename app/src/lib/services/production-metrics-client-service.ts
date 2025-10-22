import { SupabaseClient } from '@supabase/supabase-js'
import { RepairType } from '@/lib/types/business-types'

export class ProductionMetricsClientService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Update production metrics for a specific date
   * @param date - Date to update metrics for (defaults to today)
   * @param updates - Object containing metric updates
   */
  async updateMetrics(
    date: string = new Date().toISOString().split('T')[0],
    updates: {
      devices_received?: number
      devices_in_repair?: number
      devices_completed?: number
      devices_shipped?: number
      housing_changes?: number
      glass_changes?: number
      battery_changes?: number
      software_updates?: number
      other_repairs?: number
      grade_a_count?: number
      grade_b_count?: number
      grade_c_count?: number
      fail_qc_count?: number
      initial_grade_a_count?: number
      initial_grade_b_count?: number
      initial_grade_c_count?: number
      batches_created?: number
    }
  ) {
    try {
      // First, try to get existing metrics for the date
      const { data: existingMetrics, error: selectError } = await this.supabase
        .from('production_metrics')
        .select('*')
        .eq('metric_date', date)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error selecting existing metrics:', selectError)
      }

      // Calculate new values by adding updates to existing values
      const newMetrics = {
        metric_date: date,
        devices_received: (existingMetrics?.devices_received || 0) + (updates.devices_received || 0),
        devices_in_repair: (existingMetrics?.devices_in_repair || 0) + (updates.devices_in_repair || 0),
        devices_completed: (existingMetrics?.devices_completed || 0) + (updates.devices_completed || 0),
        devices_shipped: (existingMetrics?.devices_shipped || 0) + (updates.devices_shipped || 0),
        housing_changes: (existingMetrics?.housing_changes || 0) + (updates.housing_changes || 0),
        glass_changes: (existingMetrics?.glass_changes || 0) + (updates.glass_changes || 0),
        battery_changes: (existingMetrics?.battery_changes || 0) + (updates.battery_changes || 0),
        software_updates: (existingMetrics?.software_updates || 0) + (updates.software_updates || 0),
        other_repairs: (existingMetrics?.other_repairs || 0) + (updates.other_repairs || 0),
        grade_a_count: (existingMetrics?.grade_a_count || 0) + (updates.grade_a_count || 0),
        grade_b_count: (existingMetrics?.grade_b_count || 0) + (updates.grade_b_count || 0),
        grade_c_count: (existingMetrics?.grade_c_count || 0) + (updates.grade_c_count || 0),
        fail_qc_count: (existingMetrics?.fail_qc_count || 0) + (updates.fail_qc_count || 0),
        initial_grade_a_count: (existingMetrics?.initial_grade_a_count || 0) + (updates.initial_grade_a_count || 0),
        initial_grade_b_count: (existingMetrics?.initial_grade_b_count || 0) + (updates.initial_grade_b_count || 0),
        initial_grade_c_count: (existingMetrics?.initial_grade_c_count || 0) + (updates.initial_grade_c_count || 0),
        batches_created: (existingMetrics?.batches_created || 0) + (updates.batches_created || 0),
      }

      // Upsert production_metrics for the date
      const { error: metricsError } = await this.supabase
        .from('production_metrics')
        .upsert(newMetrics, {
          onConflict: 'metric_date',
          ignoreDuplicates: false
        })

      if (metricsError) {
        console.error('Failed to update production metrics:', metricsError)
        throw metricsError
      }

      return newMetrics

    } catch (error) {
      console.error('Error updating metrics:', error)
      throw error
    }
  }

  /**
   * Update repair metrics when required repairs are added during initial QC
   * @param requiredRepairs - Array of repair types that were added
   * @param date - Date to update metrics for (defaults to today)
   */
  async updateRepairMetrics(requiredRepairs: RepairType[], date: string = new Date().toISOString().split('T')[0]) {
    try {
      if (!requiredRepairs || requiredRepairs.length === 0) {
        return { devices_in_repair: 0 }
      }

      // Count each repair type
      const repairCounts = {
        housing_changes: 0,
        glass_changes: 0,
        battery_changes: 0,
        software_updates: 0,
        other_repairs: 0,
        devices_in_repair: 1 // Add 1 device to repair count
      }

      // Count each repair type
      for (const repairType of requiredRepairs) {
        switch (repairType) {
          case 'housing_change':
            repairCounts.housing_changes += 1
            break
          case 'glass_change':
            repairCounts.glass_changes += 1
            break
          case 'battery_change':
            repairCounts.battery_changes += 1
            break
          case 'software_update':
            repairCounts.software_updates += 1
            break
          case 'other':
            repairCounts.other_repairs += 1
            break
          default:
            console.warn(`Unknown repair type: ${repairType}`)
        }
      }

      // Update the metrics
      await this.updateMetrics(date, repairCounts)

      return repairCounts

    } catch (error) {
      console.error('Error updating repair metrics:', error)
      throw error
    }
  }

  /**
   * Update grade metrics when a grade is assigned during initial QC
   * @param grade - Grade that was assigned ('A', 'B', or 'C')
   * @param date - Date to update metrics for (defaults to today)
   */
  async updateGradeMetrics(grade: 'A' | 'B' | 'C', date: string = new Date().toISOString().split('T')[0]) {
    try {
      if (!grade || !['A', 'B', 'C'].includes(grade)) {
        console.warn('Invalid grade provided:', grade)
        return {}
      }

      const gradeUpdates: {
        grade_a_count?: number
        grade_b_count?: number
        grade_c_count?: number
      } = {}
      
      // Add 1 to the appropriate grade count
      switch (grade) {
        case 'A':
          gradeUpdates.grade_a_count = 1
          break
        case 'B':
          gradeUpdates.grade_b_count = 1
          break
        case 'C':
          gradeUpdates.grade_c_count = 1
          break
        default:
          console.warn(`Unknown grade: ${grade}`)
      }

      // Update the metrics
      await this.updateMetrics(date, gradeUpdates)

      return gradeUpdates

    } catch (error) {
      console.error('Error updating grade metrics:', error)
      throw error
    }
  }

  /**
   * Update initial grade metrics when initial grades are assigned during batch intake
   * @param grade - Initial grade that was assigned ('A', 'B', or 'C')
   * @param date - Date to update metrics for (defaults to today)
   */
  async updateInitialGradeMetrics(grade: 'A' | 'B' | 'C', date: string = new Date().toISOString().split('T')[0]) {
    try {
      if (!grade || !['A', 'B', 'C'].includes(grade)) {
        console.warn('Invalid grade provided:', grade)
        return {}
      }

      const initialGradeUpdates: {
        initial_grade_a_count?: number
        initial_grade_b_count?: number
        initial_grade_c_count?: number
      } = {}
      
      // Add 1 to the appropriate initial grade count
      switch (grade) {
        case 'A':
          initialGradeUpdates.initial_grade_a_count = 1
          break
        case 'B':
          initialGradeUpdates.initial_grade_b_count = 1
          break
        case 'C':
          initialGradeUpdates.initial_grade_c_count = 1
          break
        default:
          console.warn(`Unknown grade: ${grade}`)
      }

      // Update the metrics
      await this.updateMetrics(date, initialGradeUpdates)

      return initialGradeUpdates

    } catch (error) {
      console.error('Error updating initial grade metrics:', error)
      throw error
    }
  }
}
