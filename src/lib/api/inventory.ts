import type { SupabaseClient } from '@supabase/supabase-js'
import { SparePart } from '@/lib/types/business-types'

// Enhanced types for better type safety and validation
export interface CreateSparePartData {
  name: string
  description?: string
  category?: string
  compatible_models?: string[]
  minimum_stock_level?: number
  unit_cost?: number
  primary_supplier_id?: string
}

export interface UpdateSparePartData {
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
    // Generate next SKU
    const sku = await this.getNextSku()

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
    const { data, error } = await this.supabase
      .from('spare_parts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
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
