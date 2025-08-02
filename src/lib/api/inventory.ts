import { createClient } from '@/lib/supabase/client'
import { SparePart } from '@/lib/types'

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
      .order('part_name', { ascending: true })

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
      .lt('quantity', 'min_quantity')
      .order('quantity', { ascending: true })

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
        quantity, 
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
      .select('quantity')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Update with new quantity
    const newQuantity = (part.quantity || 0) + quantityToAdd
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
}