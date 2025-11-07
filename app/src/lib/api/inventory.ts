import type { SupabaseClient } from '@supabase/supabase-js'
import { SparePart, LedgerEntry, LedgerFilters, LedgerData } from '@/lib/types/business-types'
import dayjs from 'dayjs'

// Enhanced types for better type safety and validation
export interface CreateSparePartData {
  sku?: string
  name: string
  description?: string
  category?: string
  compatible_models?: string[]
  minimum_stock_level?: number
  unit_cost?: number
  primary_supplier_id?: string
}

export interface UpdateSparePartData {
  sku?: string
  name?: string
  description?: string
  category?: string
  compatible_models?: string[]
  minimum_stock_level?: number
  unit_cost?: number
  primary_supplier_id?: string
}

export interface PartsFilters {
  category?: string
  search?: string
  supplier_id?: string
  low_stock?: boolean
}

// Additional types for better structure
export interface SparePartWithSupplier extends Omit<SparePart, 'suppliers'> {
  suppliers?: {
    id: string
    name: string
  } | null
}

export interface StockAdjustmentResult {
  success: boolean
  message: string
  newStockLevel?: number
}

/**
 * Inventory API with dependency injection pattern
 * Accepts Supabase client as parameter to avoid creating multiple clients
 */
export class InventoryAPI {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get next available SKU number
   */
  async getNextSku(): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('spare_parts')
        .select('sku')
        .like('sku', 'SKU-%')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        throw new Error(`Failed to fetch SKU: ${error.message}`)
      }

      if (!data || data.length === 0) {
        return 'SKU-001'
      }

      // Extract number from last SKU (e.g., "SKU-005" -> 5)
      const lastSku = data[0].sku
      const match = lastSku.match(/SKU-(\d+)/)
      const lastNumber = match ? parseInt(match[1], 10) : 0
      const nextNumber = lastNumber + 1

      return `SKU-${nextNumber.toString().padStart(3, '0')}`
    } catch (error) {
      console.error('Error in getNextSku:', error)
      throw error
    }
  }

  /**
   * Get all spare parts with filters
   */
  async getAllParts(filters?: PartsFilters): Promise<SparePartWithSupplier[]> {
    try {
      let query = this.supabase
        .from('spare_parts')
        .select(`
          *,
          suppliers:primary_supplier_id(id, name)
        `)
        .is('deleted_at', null)

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }
      
      if (filters?.supplier_id) {
        query = query.eq('primary_supplier_id', filters.supplier_id)
      }
      
      if (filters?.low_stock) {
        query = query.lt('quantity_in_stock', 'minimum_stock_level')
      }

      query = query.order('name', { ascending: true })

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch parts: ${error.message}`)
      }

      return data as SparePartWithSupplier[]
    } catch (error) {
      console.error('Error in getAllParts:', error)
      throw error
    }
  }

  /**
   * Get single spare part by ID
   */
  async getPartById(id: string) {
    const { data, error } = await this.supabase
      .from('spare_parts')
      .select(`
        *,
        suppliers:primary_supplier_id(id, name)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data as SparePart
  }

  /**
   * Get parts with low stock
   */
  async getLowStockParts() {
    const { data, error } = await this.supabase
      .from('spare_parts')
      .select(`
        *,
        suppliers:primary_supplier_id(id, name)
      `)
      .is('deleted_at', null)
      .filter('quantity_in_stock', 'lte', 'minimum_stock_level')
      .order('quantity_in_stock', { ascending: true })

    if (error) throw error
    return data as SparePart[]
  }

  /**
   * Create a new spare part
   */
  async createPart(partData: CreateSparePartData) {
    // Use provided SKU or generate next SKU if not provided
    const sku = partData.sku || await this.getNextSku()

    const { data, error } = await this.supabase
      .from('spare_parts')
      .insert({
        sku,
        quantity_in_stock: 0, // Start with 0 stock
        ...partData,
      })
      .select(`
        *,
        suppliers:primary_supplier_id(id, name)
      `)
      .single()

    if (error) throw error
    return data as SparePart
  }

  /**
   * Update spare part details
   */
  async updatePart(id: string, partData: UpdateSparePartData) {
    const { data, error } = await this.supabase
      .from('spare_parts')
      .update(partData)
      .eq('id', id)
      .is('deleted_at', null)
      .select(`
        *,
        suppliers:primary_supplier_id(id, name)
      `)
      .single()

    if (error) throw error
    return data as SparePart
  }

  /**
   * Soft delete spare part
   */
  async deletePart(id: string) {
    console.log(`InventoryAPI: Attempting to soft delete spare part ${id}`)
    
    const { data, error } = await this.supabase
      .from('spare_parts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`InventoryAPI: Error deleting spare part ${id}:`, error)
      throw error
    }
    
    console.log(`InventoryAPI: Successfully soft deleted spare part ${id}`)
    return data
  }

  /**
   * Check if SKU is unique
   */
  async isSkuUnique(sku: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('spare_parts')
      .select('id')
      .eq('sku', sku)
      .is('deleted_at', null)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return data.length === 0
  }

  /**
   * Get parts by category
   */
  async getPartsByCategory(category: string) {
    return this.getAllParts({ category })
  }

  /**
   * Search parts by name or SKU
   */
  async searchParts(searchTerm: string) {
    return this.getAllParts({ search: searchTerm })
  }

  /**
   * Get parts by supplier
   */
  async getPartsBySupplier(supplierId: string) {
    return this.getAllParts({ supplier_id: supplierId })
  }

  /**
   * Record parts usage when completing repairs
   * This will trigger the DB trigger to deduct stock automatically
   */
  async recordPartsUsage(repairId: string, partsUsed: Array<{ spare_part_id: string; quantity_used: number; notes?: string }>): Promise<void> {
    try {
      // Insert into repair_parts_used table for each part
      for (const part of partsUsed) {
        const { error } = await this.supabase
          .from('repair_parts_used')
          .insert({
            repair_job_id: repairId,
            spare_part_id: part.spare_part_id,
            quantity_used: part.quantity_used,
            notes: part.notes || null
          })

        if (error) {
          console.error('Error recording part usage:', error)
          throw new Error(`Failed to record usage for part ${part.spare_part_id}: ${error.message}`)
        }
      }
    } catch (error) {
      console.error('Error in recordPartsUsage:', error)
      throw error
    }
  }

  /**
   * Get ledger entries for a specific part
   */
  async getPartLedger(partId: string, filters?: LedgerFilters): Promise<LedgerData> {
    try {
      // Get part information
      const part = await this.getPartById(partId)
      if (!part) {
        throw new Error('Part not found')
      }

      // Build date filter
      const dateFilter = filters?.start_date && filters?.end_date
        ? { start: filters.start_date, end: filters.end_date }
        : undefined

      // Get parts used entries with repair jobs and devices
      let partsUsedQuery = this.supabase
        .from('repair_parts_used')
        .select(`
          id,
          quantity_used,
          recorded_at,
          created_at,
          recorded_by,
          repair_jobs:repair_job_id (
            id,
            device_id
          )
        `)
        .eq('spare_part_id', partId)
        .order('recorded_at', { ascending: true })

      if (dateFilter) {
        partsUsedQuery = partsUsedQuery
          .gte('recorded_at', dateFilter.start)
          .lte('recorded_at', dateFilter.end)
      }

      if (filters?.technician_id) {
        partsUsedQuery = partsUsedQuery.eq('recorded_by', filters.technician_id)
      }

      const { data: partsUsedData, error: partsUsedError } = await partsUsedQuery

      if (partsUsedError) {
        throw new Error(`Failed to fetch parts used: ${partsUsedError.message}`)
      }

      // Get device IDs from repair jobs
      const deviceIds = [...new Set(
        (partsUsedData || [])
          .map((entry: any) => entry.repair_jobs?.device_id)
          .filter(Boolean)
      )]

      // Fetch devices with batch info
      let devicesData: any[] = []
      if (deviceIds.length > 0) {
        let devicesQuery = this.supabase
          .from('devices')
          .select(`
            id,
            internal_id,
            brand,
            model,
            storage_capacity,
            color,
            batch_id,
            batches:batch_id (
              batch_number,
              id
            )
          `)
          .in('id', deviceIds)

        if (filters?.batch_id) {
          devicesQuery = devicesQuery.eq('batch_id', filters.batch_id)
        }

        const { data: devices, error: devicesError } = await devicesQuery
        if (devicesError) {
          throw new Error(`Failed to fetch devices: ${devicesError.message}`)
        }
        devicesData = devices || []
      }

      // Fetch user profiles for technicians
      const technicianIds = [...new Set(
        (partsUsedData || [])
          .map((entry: any) => entry.recorded_by)
          .filter(Boolean)
      )]

      let techniciansData: any[] = []
      if (technicianIds.length > 0) {
        const { data: technicians, error: techniciansError } = await this.supabase
          .from('user_profiles')
          .select('id, email')
          .in('id', technicianIds)

        if (techniciansError) {
          throw new Error(`Failed to fetch technicians: ${techniciansError.message}`)
        }
        techniciansData = technicians || []
      }

      // Get stock adjustments entries
      let adjustmentsQuery = this.supabase
        .from('stock_adjustments')
        .select(`
          id,
          adjustment_type,
          quantity,
          reference_number,
          created_at,
          performed_by
        `)
        .eq('spare_part_id', partId)
        .order('created_at', { ascending: true })

      if (dateFilter) {
        adjustmentsQuery = adjustmentsQuery
          .gte('created_at', dateFilter.start)
          .lte('created_at', dateFilter.end)
      }

      if (filters?.technician_id) {
        adjustmentsQuery = adjustmentsQuery.eq('performed_by', filters.technician_id)
      }

      if (filters?.transaction_type && filters.transaction_type !== 'used') {
        adjustmentsQuery = adjustmentsQuery.eq('adjustment_type', filters.transaction_type)
      }

      const { data: adjustmentsData, error: adjustmentsError } = await adjustmentsQuery

      if (adjustmentsError) {
        throw new Error(`Failed to fetch stock adjustments: ${adjustmentsError.message}`)
      }

      // Fetch user profiles for adjustments
      const adjustmentTechnicianIds = [...new Set(
        (adjustmentsData || [])
          .map((entry: any) => entry.performed_by)
          .filter(Boolean)
      )]

      let adjustmentTechniciansData: any[] = []
      if (adjustmentTechnicianIds.length > 0) {
        const { data: adjustmentTechnicians, error: adjustmentTechniciansError } = await this.supabase
          .from('user_profiles')
          .select('id, email')
          .in('id', adjustmentTechnicianIds)

        if (adjustmentTechniciansError) {
          throw new Error(`Failed to fetch adjustment technicians: ${adjustmentTechniciansError.message}`)
        }
        adjustmentTechniciansData = adjustmentTechnicians || []
      }

      // Transform parts used entries
      const partsUsedEntries: LedgerEntry[] = (partsUsedData || [])
        .filter((entry: any) => {
          // Filter by transaction type if specified
          if (filters?.transaction_type && filters.transaction_type !== 'used') {
            return false
          }
          // Filter by batch if specified
          if (filters?.batch_id) {
            const device = devicesData.find((d: any) => d.id === entry.repair_jobs?.device_id)
            if (!device || device.batch_id !== filters.batch_id) {
              return false
            }
          }
          return true
        })
        .map((entry: any) => {
          const device = devicesData.find((d: any) => d.id === entry.repair_jobs?.device_id)
          const batch = device?.batches
          const technician = techniciansData.find((t: any) => t.id === entry.recorded_by)

          return {
            id: entry.id,
            date_time: entry.recorded_at || entry.created_at,
            ref: batch?.batch_number ? `Batch# ${batch.batch_number}` : 'Repair',
            technician_name: technician?.email,
            device_id: device?.id,
            device_internal_id: device?.internal_id,
            device_brand: device?.brand,
            device_model: device?.model,
            device_storage: device?.storage_capacity,
            device_color: device?.color,
            qty_plus: undefined,
            qty_minus: entry.quantity_used,
            balance: 0, // Will be calculated later
            transaction_type: 'used' as const,
            batch_number: batch?.batch_number,
          }
        })

      // Transform stock adjustments entries
      const adjustmentsEntries: LedgerEntry[] = (adjustmentsData || [])
        .map((entry: any) => {
          const technician = adjustmentTechniciansData.find((t: any) => t.id === entry.performed_by)
          // Corrections should always show as "Correction", regardless of reference_number
          const ref = entry.adjustment_type === 'correction'
            ? 'Correction'
            : entry.reference_number 
            ? `Purchase Inv ${entry.reference_number}`
            : entry.adjustment_type === 'add'
            ? 'Stock Addition'
            : 'Stock Removal'

          // For correction, show quantity in qty_plus if positive, or in qty_minus if negative
          const correctionQty = entry.adjustment_type === 'correction' ? entry.quantity : undefined
          
          return {
            id: entry.id,
            date_time: entry.created_at,
            ref,
            technician_name: technician?.email,
            device_id: undefined,
            device_internal_id: undefined,
            device_brand: undefined,
            device_model: undefined,
            device_storage: undefined,
            device_color: undefined,
            qty_plus: entry.adjustment_type === 'add' 
              ? Math.abs(entry.quantity) 
              : entry.adjustment_type === 'correction' && correctionQty && correctionQty >= 0
                ? correctionQty
                : undefined,
            qty_minus: entry.adjustment_type === 'remove' 
              ? Math.abs(entry.quantity) 
              : entry.adjustment_type === 'correction' && correctionQty && correctionQty < 0
                ? Math.abs(correctionQty)
                : undefined,
            balance: 0, // Will be calculated later
            transaction_type: entry.adjustment_type as 'add' | 'remove' | 'correction',
            batch_number: undefined,
          }
        })

      // Combine and sort all entries chronologically
      const allEntries = [...partsUsedEntries, ...adjustmentsEntries].sort((a, b) => {
        return new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
      })

      // Calculate opening balance
      let openingBalance: number | undefined
      
      if (dateFilter) {
        // Get all transactions BEFORE start date to calculate forward from beginning
        const { data: beforePartsUsed } = await this.supabase
          .from('repair_parts_used')
          .select('quantity_used, recorded_at')
          .eq('spare_part_id', partId)
          .lt('recorded_at', dateFilter.start)
          .order('recorded_at', { ascending: true })

        const { data: beforeAdjustments } = await this.supabase
          .from('stock_adjustments')
          .select('adjustment_type, quantity, created_at')
          .eq('spare_part_id', partId)
          .lt('created_at', dateFilter.start)
          .order('created_at', { ascending: true })

        // Calculate forward from beginning (0) to start date
        let balance = 0
        const beforeTransactions = [
          ...(beforePartsUsed || []).map((e: any) => ({ type: 'used', qty: e.quantity_used, date: e.recorded_at })),
          ...(beforeAdjustments || []).map((e: any) => ({ 
            type: e.adjustment_type, 
            qty: e.quantity, // Keep original sign for corrections
            date: e.created_at 
          }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Calculate forward from beginning
        for (const trans of beforeTransactions) {
          if (trans.type === 'used') {
            balance -= trans.qty
          } else if (trans.type === 'add') {
            balance += trans.qty
          } else if (trans.type === 'remove') {
            balance -= trans.qty
          } else if (trans.type === 'correction') {
            // Correction sets the balance to exact quantity
            balance = trans.qty
          }
        }

        openingBalance = balance
      }
      // If no date range, openingBalance remains undefined (should not be shown)

      // Calculate running balance forward from opening balance
      // If no date range, start from the calculated opening balance (which would be 0 or initial stock)
      // For date range, use the calculated opening balance
      // For no date range, we need to calculate from the very first transaction
      let runningBalance: number
      
      if (openingBalance !== undefined) {
        // Date range is applied, use calculated opening balance
        runningBalance = openingBalance
      } else {
        // No date range: calculate opening balance from all transactions to start from beginning
        let balance = 0
        const allTransactions = allEntries.map((e) => {
          let qty = e.qty_plus || e.qty_minus || 0
          // For corrections, get quantity from adjustmentsData
          if (e.transaction_type === 'correction') {
            const adjustment = adjustmentsData?.find((a: any) => a.id === e.id)
            qty = adjustment?.quantity || 0
          }
          return {
            type: e.transaction_type,
            qty,
            date: e.date_time
          }
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Calculate forward from beginning to get starting balance
        for (const trans of allTransactions) {
          if (trans.type === 'used') {
            balance -= trans.qty
          } else if (trans.type === 'add') {
            balance += trans.qty
          } else if (trans.type === 'remove') {
            balance -= trans.qty
          } else if (trans.type === 'correction') {
            balance = trans.qty
          }
        }
        
        runningBalance = balance
      }
      
      // Calculate running balance for each entry in chronological order
      const entriesWithBalance = allEntries.map((entry) => {
        // For correction type, set balance to the exact correction quantity (absolute value)
        // Corrections override the running balance completely
        if (entry.transaction_type === 'correction') {
          const adjustment = adjustmentsData?.find((a: any) => a.id === entry.id)
          if (adjustment) {
            // Correction sets the balance to the exact quantity value
            runningBalance = adjustment.quantity
          }
        } else {
          // For other transaction types, calculate balance forward
          if (entry.qty_plus) {
            runningBalance += entry.qty_plus
          }
          if (entry.qty_minus) {
            runningBalance -= entry.qty_minus
          }
        }

        return {
          ...entry,
          balance: runningBalance,
        }
      })

      // Generate period label
      let periodLabel = 'All time'
      if (dateFilter) {
        const startDate = dayjs(dateFilter.start).format('DD MMM YYYY')
        const endDate = dayjs(dateFilter.end).format('DD MMM YYYY')
        periodLabel = `From ${startDate} to ${endDate}`
      }

      return {
        part,
        entries: entriesWithBalance,
        opening_balance: openingBalance,
        period_label: periodLabel,
      }
    } catch (error) {
      console.error('Error in getPartLedger:', error)
      throw error
    }
  }
}

/**
 * Factory function to create InventoryAPI instance with client
 * This maintains backward compatibility while implementing dependency injection
 */
export function createInventoryAPI(supabase: SupabaseClient): InventoryAPI {
  return new InventoryAPI(supabase)
}

/**
 * Legacy singleton instance for backward compatibility
 * @deprecated Use createInventoryAPI() with dependency injection instead
 */
import { createSupabaseClient } from '@/lib/supabase/client'
export const inventoryApi = new InventoryAPI(createSupabaseClient()!)
