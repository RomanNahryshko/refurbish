/**
 * Client-side API functions for supplier management
 * These functions call the API routes which enforce server-side permissions
 */

export interface Supplier {
  id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  supplier_type: 'devices' | 'parts' | 'both'
  notes?: string
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
  type?: 'devices' | 'parts' | 'both'
  search?: string
}

/**
 * Fetch all suppliers with optional filters
 */
export async function getAll(filters?: SuppliersFilters): Promise<Supplier[]> {
  const searchParams = new URLSearchParams()
  
  if (filters?.type) searchParams.set('type', filters.type)
  if (filters?.search) searchParams.set('search', filters.search)
  
  const url = `/api/suppliers${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to fetch suppliers: ${response.statusText}`)
  }
  
  const data = await response.json()
  
  return data
}

/**
 * Get suppliers that provide parts
 */
export async function getPartsSuppliers(): Promise<Supplier[]> {
  // Fetch suppliers that provide parts or both
  const partsSuppliers = await getAll()
  
  return partsSuppliers
}

/**
 * Fetch a single supplier by ID
 */
export async function getById(id: string): Promise<Supplier> {
  const response = await fetch(`/api/suppliers/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch supplier: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Create a new supplier
 */
export async function create(supplierData: CreateSupplierData): Promise<Supplier> {
  const response = await fetch('/api/suppliers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(supplierData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create supplier')
  }
  
  return response.json()
}

/**
 * Update an existing supplier
 */
export async function update(id: string, supplierData: UpdateSupplierData): Promise<Supplier> {
  const response = await fetch(`/api/suppliers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(supplierData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update supplier')
  }
  
  return response.json()
}

/**
 * Delete a supplier (soft delete)
 */
export async function deleteSupplier(id: string): Promise<void> {
  const response = await fetch(`/api/suppliers/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete supplier')
  }
}

// Export as an object for backwards compatibility
export const suppliersApi = {
  getAll,
  getPartsSuppliers,
  getById,
  create,
  update,
  delete: deleteSupplier,
}
