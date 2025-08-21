import { createSupabaseServerClient } from '@/lib/supabase/server'
import { SparePart } from '@/lib/types/business-types'

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

export const inventoryApi = {
  /**
   * Get next available SKU number
   */
  async getNextSku(): Promise<string> {
    const supabase = await createSupabaseServerClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('spare_parts')
      .select('sku')
      .like('sku', 'SKU-%')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw error

    if (!data || data.length === 0) {
      return 'SKU-001'
    }

    // Extract number from last SKU (e.g., "SKU-005" -> 5)
    const lastSku = data[0].sku
    const match = lastSku.match(/SKU-(\d+)/)
    const lastNumber = match ? parseInt(match[1], 10) : 0
    const nextNumber = lastNumber + 1

    return `SKU-${nextNumber.toString().padStart(3, '0')}`
  },

  /**
   * Get all spare parts with filters
   */
  async getAllParts(filters?: PartsFilters) {
    const supabase = await createSupabaseServerClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    let query = supabase
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

    if (error) throw error
    return data as SparePart[]
  },

  /**
   * Get single spare part by ID
   */
  async getPartById(id: string) {
    const supabase = await createSupabaseServerClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
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
  },

  /**
   * Get parts with low stock
   */
  async getLowStockParts() {
    const supabase = await createSupabaseServerClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
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
  },

  /**
   * Create a new spare part
   */
  async createPart(partData: CreateSparePartData) {
    const supabase = await createSupabaseServerClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // Generate next SKU
    const sku = await this.getNextSku()

    const { data, error } = await supabase
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
  },

  /**
   * Update spare part details
   */
  async updatePart(id: string, partData: UpdateSparePartData) {
    const supabase = await createSupabaseServerClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
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
  },

  /**
   * Soft delete spare part
   */
  async deletePart(id: string) {
    const supabase = await createSupabaseServerClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('spare_parts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Check if SKU is unique
   */
  async isSkuUnique(sku: string, excludeId?: string): Promise<boolean> {
    const supabase = await createSupabaseServerClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    let query = supabase
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
  },

  /**
   * Get parts by category
   */
  async getPartsByCategory(category: string) {
    return this.getAllParts({ category })
  },

  /**
   * Search parts by name or SKU
   */
  async searchParts(searchTerm: string) {
    return this.getAllParts({ search: searchTerm })
  },

  /**
   * Get parts by supplier
   */
  async getPartsBySupplier(supplierId: string) {
    return this.getAllParts({ supplier_id: supplierId })
  },

  /**
   * Record parts usage when completing repairs
   * This will trigger the DB trigger to deduct stock automatically
   */
  async recordPartsUsage(repairId: string, partsUsed: Array<{ spare_part_id: string; quantity_used: number; notes?: string }>): Promise<void> {
    const supabase = await createSupabaseServerClient()
    if (!supabase) throw new Error('Supabase client not initialized')
    
    try {
      // Insert into repair_parts_used table for each part
      for (const part of partsUsed) {
        const { error } = await supabase
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
  },
}