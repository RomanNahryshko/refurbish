import { createClient } from '@/lib/supabase/client'

export interface Supplier {
  id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  supplier_type: 'devices' | 'parts' | 'both'
  notes?: string
  created_by?: string
  created_at: string
  updated_at?: string
  deleted_at?: string
}

export interface CreateSupplierData {
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  supplier_type: 'devices' | 'parts' | 'both'
  notes?: string
}

export const suppliersApi = {
  /**
   * Get all suppliers
   */
  async getAll() {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .is('deleted_at', null)
      .order('name')

    if (error) throw error
    return data as Supplier[]
  },

  /**
   * Get suppliers by type
   */
  async getByType(type: 'devices' | 'parts' | 'both') {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .or(`supplier_type.eq.${type},supplier_type.eq.both`)
      .is('deleted_at', null)
      .order('name')

    if (error) throw error
    return data as Supplier[]
  },

  /**
   * Get a single supplier by ID
   */
  async getById(id: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data as Supplier
  },

  /**
   * Create a new supplier
   */
  async create(supplierData: CreateSupplierData) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single()

    if (error) throw error
    return data as Supplier
  },

  /**
   * Update an existing supplier
   */
  async update(id: string, supplierData: Partial<CreateSupplierData>) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('suppliers')
      .update({
        ...supplierData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Supplier
  },

  /**
   * Delete a supplier (soft delete)
   */
  async delete(id: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { error } = await supabase
      .from('suppliers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return true
  }
}

