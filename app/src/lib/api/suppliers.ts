import type { SupabaseClient } from '@supabase/supabase-js'
import { Supplier } from '@/lib/types/business-types'

// Enhanced types for better type safety and validation
export interface CreateSupplierData {
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  supplier_type: 'devices' | 'parts' | 'both'
  notes?: string
}

export type UpdateSupplierData = Partial<CreateSupplierData>

// Additional types for better structure
export interface SupplierFilters {
  type?: 'devices' | 'parts' | 'both'
  search?: string
  active_only?: boolean
}

export interface SupplierWithStats extends Supplier {
  device_count?: number
  parts_count?: number
  total_orders?: number
}

/**
 * Suppliers API with dependency injection pattern
 * Accepts Supabase client as parameter to avoid creating multiple clients
 */
export class SuppliersAPI {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all suppliers
   */
  async getAll(): Promise<Supplier[]> {
    try {
      const { data, error } = await this.supabase
        .from('suppliers')
        .select('*')
        .is('deleted_at', null)
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch suppliers: ${error.message}`)
      }

      return data as Supplier[]
    } catch (error) {
      console.error('Error in getAll:', error)
      throw error
    }
  }

  /**
   * Get suppliers by type
   */
  async getByType(type: 'devices' | 'parts' | 'both'): Promise<Supplier[]> {
    try {
      const { data, error } = await this.supabase
        .from('suppliers')
        .select('*')
        .or(`supplier_type.eq.${type},supplier_type.eq.both`)
        .is('deleted_at', null)
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch suppliers by type: ${error.message}`)
      }

      return data as Supplier[]
    } catch (error) {
      console.error('Error in getByType:', error)
      throw error
    }
  }

  /**
   * Get suppliers that provide parts (for inventory dropdowns)
   */
  async getPartsSuppliers(): Promise<Supplier[]> {
    try {
      return await this.getByType('parts')
    } catch (error) {
      console.error('Error in getPartsSuppliers:', error)
      throw error
    }
  }

  /**
   * Get a single supplier by ID
   */
  async getById(id: string): Promise<Supplier> {
    try {
      const { data, error } = await this.supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      if (error) {
        throw new Error(`Failed to fetch supplier: ${error.message}`)
      }

      return data as Supplier
    } catch (error) {
      console.error('Error in getById:', error)
      throw error
    }
  }

  /**
   * Create a new supplier
   */
  async create(supplierData: CreateSupplierData): Promise<Supplier> {
    try {
      const { data, error } = await this.supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create supplier: ${error.message}`)
      }

      return data as Supplier
    } catch (error) {
      console.error('Error in create:', error)
      throw error
    }
  }

  /**
   * Update an existing supplier
   */
  update = async (id: string, supplierData: UpdateSupplierData) => {


    const { data, error } = await this.supabase
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


    const { error } = await this.supabase
      .from('suppliers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return true
  }
}

/**
 * Factory function to create SuppliersAPI instance with client
 * This maintains backward compatibility while implementing dependency injection
 */
export function createSuppliersAPI(supabase: SupabaseClient): SuppliersAPI {
  return new SuppliersAPI(supabase)
}

/**
 * Legacy singleton instance for backward compatibility
 * @deprecated Use createSuppliersAPI() with dependency injection instead
 */
import { createSupabaseClient } from '@/lib/supabase/client'
export const suppliersApi = new SuppliersAPI(createSupabaseClient()!)

