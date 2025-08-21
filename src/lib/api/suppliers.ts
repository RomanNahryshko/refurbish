import { createSupabaseClient } from '@/lib/supabase/client'
import { Supplier } from '@/lib/types/business-types'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface CreateSupplierData {
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  supplier_type: 'devices' | 'parts' | 'both'
  notes?: string
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {}

/**
 * Optimized Suppliers API with singleton Supabase client
 */
class SuppliersAPI {
  private client: SupabaseClient | null = null

  /**
   * Get or create the singleton Supabase client
   * This ensures we reuse the same client instance across all API calls
   */
  private getClient = (): SupabaseClient => {
    if (!this.client) {
      this.client = createSupabaseClient()
    }
    
    if (!this.client) {
      throw new Error('Supabase client not initialized')
    }
    
    return this.client
  }

  /**
   * Get all suppliers
   */
  getAll = async () => {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .is('deleted_at', null)
      .order('name')

    if (error) throw error
    return data as Supplier[]
  }

  /**
   * Get suppliers by type
   */
  getByType = async (type: 'devices' | 'parts' | 'both') => {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .or(`supplier_type.eq.${type},supplier_type.eq.both`)
      .is('deleted_at', null)
      .order('name')

    if (error) throw error
    return data as Supplier[]
  }

  /**
   * Get suppliers that provide parts (for inventory dropdowns)
   */
  getPartsSuppliers = async () => {
    return this.getByType('parts')
  }

  /**
   * Get a single supplier by ID
   */
  getById = async (id: string) => {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data as Supplier
  }

  /**
   * Create a new supplier
   */
  create = async (supplierData: CreateSupplierData) => {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single()

    if (error) throw error
    return data as Supplier
  }

  /**
   * Update an existing supplier
   */
  update = async (id: string, supplierData: UpdateSupplierData) => {
    const supabase = this.getClient()

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
  }

  /**
   * Delete a supplier (soft delete)
   */
  delete = async (id: string) => {
    const supabase = this.getClient()

    const { error } = await supabase
      .from('suppliers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return true
  }
}

// Export singleton instance
export const suppliersApi = new SuppliersAPI()

