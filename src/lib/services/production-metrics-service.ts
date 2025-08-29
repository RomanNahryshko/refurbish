import { createSupabaseServerClient } from '@/lib/supabase/server'
import { RepairType } from '@/lib/types/business-types'

export class ProductionMetricsService {
  private supabase: any

  constructor() {
    // Initialize supabase client
    this.supabase = null
  }

  private async getSupabaseClient() {
    try {
      if (!this.supabase) {
        console.log('🔧 ProductionMetricsService: Creating new Supabase client')
        this.supabase = await createSupabaseServerClient()
        console.log('✅ ProductionMetricsService: Supabase client created successfully')
      }
      return this.supabase
    } catch (error) {
      console.error('❌ ProductionMetricsService: Error getting Supabase client:', error)
      throw error
    }
  }

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
      batches_created?: number
    }
  ) {
    try {
      console.log('🔄 ProductionMetricsService: updateMetrics called with:', { date, updates })
      
      const supabase = await this.getSupabaseClient()
      
      console.log('🔄 ProductionMetricsService: Got Supabase client, updating metrics for date:', date, 'with updates:', updates)

      // First, try to get existing metrics for the date
      const { data: existingMetrics, error: selectError } = await supabase
        .from('production_metrics')
        .select('*')
        .eq('metric_date', date)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ ProductionMetricsService: Error selecting existing metrics:', selectError)
      }

      console.log('📊 ProductionMetricsService: Existing metrics:', existingMetrics)

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
        batches_created: (existingMetrics?.batches_created || 0) + (updates.batches_created || 0),
      }

      console.log('🧮 ProductionMetricsService: Calculated new metrics:', newMetrics)

      // Upsert production_metrics for the date
      console.log('🔧 ProductionMetricsService: Executing upsert query with data:', newMetrics)
      console.log('🔧 ProductionMetricsService: Upsert query details:', {
        table: 'production_metrics',
        conflictColumn: 'metric_date',
        conflictValue: date,
        dataToUpsert: newMetrics
      })
      
      const { error: metricsError } = await supabase
        .from('production_metrics')
        .upsert(newMetrics, {
          onConflict: 'metric_date',
          ignoreDuplicates: false
        })

      if (metricsError) {
        console.error('❌ ProductionMetricsService: Failed to update production metrics:', metricsError)
        console.error('❌ ProductionMetricsService: Error details:', {
          code: metricsError.code,
          message: metricsError.message,
          details: metricsError.details,
          hint: metricsError.hint
        })
        throw metricsError
      }
      
      console.log('✅ ProductionMetricsService: Upsert query executed successfully')

      console.log('✅ ProductionMetricsService: Successfully updated production_metrics for date:', date)
      return newMetrics

    } catch (error) {
      console.error('❌ ProductionMetricsService: Error updating metrics:', error)
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
      console.log('🔧 ProductionMetricsService: updateRepairMetrics called with:', {
        requiredRepairs,
        requiredRepairsType: typeof requiredRepairs,
        requiredRepairsIsArray: Array.isArray(requiredRepairs),
        requiredRepairsLength: requiredRepairs?.length || 0,
        date
      })

      if (!requiredRepairs || requiredRepairs.length === 0) {
        console.log('⚠️ ProductionMetricsService: No repairs provided, skipping metrics update')
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

      console.log('🔧 ProductionMetricsService: Initial repair counts:', repairCounts)

      // Count each repair type
      for (const repairType of requiredRepairs) {
        console.log(`🔧 ProductionMetricsService: Processing repair type: ${repairType} (${typeof repairType})`)
        
        switch (repairType) {
          case 'housing_change':
            repairCounts.housing_changes += 1
            console.log('🏠 ProductionMetricsService: Incremented housing_changes count to:', repairCounts.housing_changes)
            break
          case 'glass_change':
            repairCounts.glass_changes += 1
            console.log('🪟 ProductionMetricsService: Incremented glass_changes count to:', repairCounts.glass_changes)
            break
          case 'battery_change':
            repairCounts.battery_changes += 1
            console.log('🔋 ProductionMetricsService: Incremented battery_changes count to:', repairCounts.battery_changes)
            break
          case 'software_update':
            repairCounts.software_updates += 1
            console.log('💾 ProductionMetricsService: Incremented software_updates count to:', repairCounts.software_updates)
            break
          case 'other':
            repairCounts.other_repairs += 1
            console.log('🔧 ProductionMetricsService: Incremented other_repairs count to:', repairCounts.other_repairs)
            break
          default:
            console.warn(`⚠️ ProductionMetricsService: Unknown repair type: ${repairType}`)
        }
      }

      console.log('📊 ProductionMetricsService: Final repair counts calculated:', repairCounts)

      // Update the metrics
      console.log('🔧 ProductionMetricsService: Calling updateMetrics with:', repairCounts)
      await this.updateMetrics(date, repairCounts)

      console.log('✅ ProductionMetricsService: Successfully updated repair metrics')
      return repairCounts

    } catch (error) {
      console.error('❌ ProductionMetricsService: Error updating repair metrics:', error)
      console.error('❌ ProductionMetricsService: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
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
      console.log('🏆 ProductionMetricsService: Updating grade metrics for grade:', grade, 'on date:', date)

      if (!grade || !['A', 'B', 'C'].includes(grade)) {
        console.warn('⚠️ ProductionMetricsService: Invalid grade provided:', grade)
        return {}
      }

      const gradeUpdates: any = {}
      
      // Add 1 to the appropriate grade count
      switch (grade) {
        case 'A':
          gradeUpdates.grade_a_count = 1
          console.log('🥇 ProductionMetricsService: Incremented grade_a_count')
          break
        case 'B':
          gradeUpdates.grade_b_count = 1
          console.log('🥈 ProductionMetricsService: Incremented grade_b_count')
          break
        case 'C':
          gradeUpdates.grade_c_count = 1
          console.log('🥉 ProductionMetricsService: Incremented grade_c_count')
          break
        default:
          console.warn(`⚠️ ProductionMetricsService: Unknown grade: ${grade}`)
      }

      console.log('📊 ProductionMetricsService: Grade updates calculated:', gradeUpdates)

      // Update the metrics
      await this.updateMetrics(date, gradeUpdates)

      console.log('✅ ProductionMetricsService: Successfully updated grade metrics')
      return gradeUpdates

    } catch (error) {
      console.error('❌ ProductionMetricsService: Error updating grade metrics:', error)
      throw error
    }
  }
}
