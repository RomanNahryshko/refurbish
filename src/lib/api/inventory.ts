import { createClient } from '@/lib/supabase/client'
import { SparePart, StockAdjustment } from '@/lib/types/business-types'

export const inventoryApi = {
  /**
   * Get all spare parts
   */
  async getAllParts() {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('spare_parts')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error
    return data as SparePart[]
  },

  /**
   * Get parts with low stock
   */
  async getLowStockParts() {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('spare_parts')
      .select('*')
      .lt('quantity_in_stock', 'minimum_stock_level')
      .is('deleted_at', null)
      .order('quantity_in_stock', { ascending: true })

    if (error) throw error
    return data as SparePart[]
  },

  /**
   * Update part quantity
   */
  async updateQuantity(id: string, quantity: number) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('spare_parts')
      .update({ 
        quantity_in_stock: quantity, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as SparePart
  },

  /**
   * Add stock to a part
   */
  async addStock(id: string, quantityToAdd: number) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // First get current quantity
    const { data: part, error: fetchError } = await supabase
      .from('spare_parts')
      .select('quantity_in_stock')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Update with new quantity
    const newQuantity = (part.quantity_in_stock || 0) + quantityToAdd
    return this.updateQuantity(id, newQuantity)
  },

  /**
   * Create a new spare part
   */
  async createPart(part: Omit<SparePart, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('spare_parts')
      .insert(part)
      .select()
      .single()

    if (error) throw error
    return data as SparePart
  },

  /**
   * Get stock adjustments for a part
   */
  async getStockAdjustments(partId: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('stock_adjustments')
      .select('*')
      .eq('spare_part_id', partId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as StockAdjustment[]
  },

  /**
   * Create a stock adjustment
   */
  async createStockAdjustment(adjustment: Omit<StockAdjustment, 'id' | 'created_at'>) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('stock_adjustments')
      .insert(adjustment)
      .select()
      .single()

    if (error) throw error
    return data as StockAdjustment
  }
}