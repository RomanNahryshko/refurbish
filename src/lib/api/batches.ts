import { createClient } from '@/lib/supabase/client'
import { Batch } from '@/lib/types'

export const batchesApi = {
  /**
   * Get all batches
   */
  async getAll() {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Batch[]
  },

  /**
   * Get a single batch by ID
   */
  async getById(id: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Batch
  },

  /**
   * Create a new batch
   */
  async create(batch: Omit<Batch, 'id' | 'created_at'>) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('batches')
      .insert(batch)
      .select()
      .single()

    if (error) throw error
    return data as Batch
  },

  /**
   * Get batch with all its phones
   */
  async getBatchWithPhones(id: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('batches')
      .select('*, phones(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },
}