import { createClient } from '@/lib/supabase/server'

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
  deleted_at?: string | null
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

export interface UpdateSupplierData {
  name?: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  supplier_type?: 'devices' | 'parts' | 'both'
  notes?: string
}

export interface SuppliersFilters {
  supplier_type?: 'devices' | 'parts' | 'both'
  search?: string
}

export const suppliersApi = {
  /**
   * Get all suppliers with filters
   */
  async getAll(filters?: SuppliersFilters) {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    let query = supabase
      .from('suppliers')
      .select('*')
      .is('deleted_at', null)

    // Apply filters
    if (filters?.supplier_type) {
      // For parts inventory, we want suppliers that provide parts
      if (filters.supplier_type === 'parts') {
        query = query.in('supplier_type', ['parts', 'both'])
      } else {
        query = query.eq('supplier_type', filters.supplier_type)
      }
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    query = query.order('name', { ascending: true })

    const { data, error } = await query

    if (error) throw error
    return data as Supplier[]
  },

  /**
   * Get suppliers that provide parts (for dropdown in inventory)
   */
  async getPartsSuppliers() {
    return this.getAll({ supplier_type: 'parts' })
  },

  /**
   * Get single supplier by ID
   */
  async getById(id: string) {
    const supabase = await createClient()
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
    const supabase = await createClient()
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
   * Update supplier
   */
  async update(id: string, supplierData: UpdateSupplierData) {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw error
    return data as Supplier
  },

  /**
   * Soft delete supplier
   */
  async delete(id: string) {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // Check if supplier is being used by any spare parts
    const { data: parts, error: checkError } = await supabase
      .from('spare_parts')
      .select('id')
      .eq('primary_supplier_id', id)
      .is('deleted_at', null)
      .limit(1)

    if (checkError) throw checkError

    if (parts && parts.length > 0) {
      throw new Error('Cannot delete supplier that is being used by spare parts')
    }

    const { data, error } = await supabase
      .from('suppliers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Search suppliers by name
   */
  async search(searchTerm: string) {
    return this.getAll({ search: searchTerm })
  },
}
