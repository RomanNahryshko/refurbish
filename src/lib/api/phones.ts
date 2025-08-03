import { createClient } from '@/lib/supabase/client'
import { Phone, PhoneFilters, PhoneStatus } from '@/lib/types/business-types'

export const phonesApi = {
  /**
   * Get all phones with optional filters
   */
  async getAll(filters?: PhoneFilters) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    let query = supabase
      .from('phones')
      .select('*, batch:batches(*)')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.batch_id) {
      query = query.eq('batch_id', filters.batch_id)
    }
    if (filters?.search) {
      query = query.or(`imei.ilike.%${filters.search}%,model.ilike.%${filters.search}%`)
    }
    if (filters?.grade) {
      query = query.eq('grade', filters.grade)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Phone[]
  },

  /**
   * Get a single phone by ID
   */
  async getById(id: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('phones')
      .select('*, batch:batches(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Phone
  },

  /**
   * Update phone status
   */
  async updateStatus(id: string, status: PhoneStatus) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('phones')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Phone
  },

  /**
   * Create a new phone record
   */
  async create(phone: Omit<Phone, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('phones')
      .insert(phone)
      .select()
      .single()

    if (error) throw error
    return data as Phone
  },
}