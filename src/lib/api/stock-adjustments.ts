import { createClient } from '@/lib/supabase/server'

export interface StockAdjustment {
  id: string
  spare_part_id: string
  adjustment_type: 'add' | 'remove' | 'correction'
  quantity: number
  reason?: string
  reference_number?: string
  performed_by?: string
  created_at: string
}

export interface CreateStockAdjustmentData {
  spare_part_id: string
  adjustment_type: 'add' | 'remove' | 'correction'
  quantity: number
  reason?: string
  reference_number?: string
}

export const stockAdjustmentsApi = {
  /**
   * Add stock to a spare part
   */
  async addStock(data: CreateStockAdjustmentData & { adjustment_type: 'add' }) {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // For adding stock, quantity should be positive and reference_number is required
    if (data.quantity <= 0) {
      throw new Error('Quantity must be positive when adding stock')
    }

    if (!data.reference_number) {
      throw new Error('Invoice/Reference number is required when adding stock')
    }

    const { data: result, error } = await supabase
      .from('stock_adjustments')
      .insert({
        ...data,
        quantity: Math.abs(data.quantity), // Ensure positive for additions
      })
      .select()
      .single()

    if (error) throw error
    return result as StockAdjustment
  },

  /**
   * Remove stock from a spare part
   */
  async removeStock(data: CreateStockAdjustmentData & { adjustment_type: 'remove' }) {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // For removing stock, quantity should be negative
    if (data.quantity <= 0) {
      throw new Error('Quantity must be positive when removing stock')
    }

    // Check current stock level to prevent negative stock
    const { data: part, error: fetchError } = await supabase
      .from('spare_parts')
      .select('quantity_in_stock')
      .eq('id', data.spare_part_id)
      .single()

    if (fetchError) throw fetchError

    if (part.quantity_in_stock < data.quantity) {
      throw new Error('Cannot remove more stock than available. Current stock: ' + part.quantity_in_stock)
    }

    const { data: result, error } = await supabase
      .from('stock_adjustments')
      .insert({
        ...data,
        quantity: -Math.abs(data.quantity), // Ensure negative for removals
      })
      .select()
      .single()

    if (error) throw error
    return result as StockAdjustment
  },

  /**
   * Make stock correction (can be positive or negative)
   */
  async correctStock(data: CreateStockAdjustmentData & { adjustment_type: 'correction' }) {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // Insert the exact quantity the user entered without any modifications
    const { data: result, error } = await supabase
      .from('stock_adjustments')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return result as StockAdjustment
  },

  /**
   * Create any type of stock adjustment with validation
   */
  async createAdjustment(data: CreateStockAdjustmentData) {
    switch (data.adjustment_type) {
      case 'add':
        return this.addStock(data as CreateStockAdjustmentData & { adjustment_type: 'add' })
      case 'remove':
        return this.removeStock(data as CreateStockAdjustmentData & { adjustment_type: 'remove' })
      case 'correction':
        return this.correctStock(data as CreateStockAdjustmentData & { adjustment_type: 'correction' })
      default:
        throw new Error('Invalid adjustment type')
    }
  },

  /**
   * Get stock adjustments for a specific part
   */
  async getAdjustmentsForPart(partId: string) {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('stock_adjustments')
      .select(`
        *,
        spare_parts(name, sku),
        user_profiles:performed_by(full_name)
      `)
      .eq('spare_part_id', partId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as StockAdjustment[]
  },

  /**
   * Get all recent stock adjustments
   */
  async getRecentAdjustments(limit: number = 50) {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('stock_adjustments')
      .select(`
        *,
        spare_parts(name, sku),
        user_profiles:performed_by(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as StockAdjustment[]
  },
}
