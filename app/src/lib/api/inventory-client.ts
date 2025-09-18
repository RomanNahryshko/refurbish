/**
 * Client-side API functions for inventory management
 * These functions call the API routes which enforce server-side permissions
 */

import { SparePart } from '@/lib/types/business-types'

export interface PartsFilters {
  search?: string
  category?: string
  supplier_id?: string
  low_stock?: boolean
}

export interface CreateSparePartData {
  sku?: string
  name: string
  description?: string
  category?: string
  compatible_models?: string[]
  minimum_stock_level?: number
  unit_cost?: number
  primary_supplier_id?: string
}

export interface UpdateSparePartData {
  sku?: string
  name?: string
  description?: string
  category?: string
  compatible_models?: string[]
  minimum_stock_level?: number
  unit_cost?: number
  primary_supplier_id?: string
}

export interface CreateStockAdjustmentData {
  spare_part_id: string
  adjustment_type: 'add' | 'remove' | 'correction'
  quantity: number
  reason?: string
  reference_number?: string
}

/**
 * Fetch all spare parts with optional filters
 */
export async function getAllParts(filters?: PartsFilters): Promise<SparePart[]> {
  const searchParams = new URLSearchParams()
  
  if (filters?.search) searchParams.set('search', filters.search)
  if (filters?.category) searchParams.set('category', filters.category)
  if (filters?.supplier_id) searchParams.set('supplier_id', filters.supplier_id)
  if (filters?.low_stock) searchParams.set('low_stock', 'true')
  
  const url = `/api/inventory/parts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch parts: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Fetch a single spare part by ID
 */
export async function getPartById(id: string): Promise<SparePart> {
  const response = await fetch(`/api/inventory/parts/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch part: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Create a new spare part
 */
export async function createPart(partData: CreateSparePartData): Promise<SparePart> {
  const response = await fetch('/api/inventory/parts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(partData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create part')
  }
  
  return response.json()
}

/**
 * Update an existing spare part
 */
export async function updatePart(id: string, partData: UpdateSparePartData): Promise<SparePart> {
  const response = await fetch(`/api/inventory/parts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(partData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update part')
  }
  
  return response.json()
}

/**
 * Delete a spare part (soft delete)
 */
export async function deletePart(id: string): Promise<void> {
  const response = await fetch(`/api/inventory/parts/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete part')
  }
}

/**
 * Create a stock adjustment
 */
export async function createStockAdjustment(adjustmentData: CreateStockAdjustmentData): Promise<void> {
  const response = await fetch('/api/inventory/stock-adjustments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adjustmentData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create stock adjustment')
  }
  
  return response.json()
}

/**
 * Record parts usage for a repair job
 */
export async function recordPartsUsage(
  repairId: string, 
  partsUsed: Array<{ spare_part_id: string; quantity_used: number; notes?: string }>
): Promise<void> {
  const response = await fetch('/api/inventory/parts/usage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repair_id: repairId,
      parts_used: partsUsed,
    }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to record parts usage')
  }
  
  return response.json()
}

/**
 * Get parts with low stock (convenience method)
 */
export async function getLowStockParts(): Promise<SparePart[]> {
  return getAllParts({ low_stock: true })
}

/**
 * Check if SKU is unique
 */
export async function isSkuUnique(sku: string, excludeId?: string): Promise<boolean> {
  const searchParams = new URLSearchParams({ sku })
  if (excludeId) searchParams.set('excludeId', excludeId)
  
  const response = await fetch(`/api/inventory/parts/check-sku?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to check SKU: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.isUnique
}

/**
 * Get next available SKU - Direct Supabase call
 */
export async function getNextSku(): Promise<string> {
  // Import Supabase client dynamically to avoid SSR issues
  const { createSupabaseClient } = await import('@/lib/supabase/client')
  
  const supabase = createSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase client not available')
  }

  // Get the highest SKU number
  const { data, error } = await supabase
    .from('spare_parts')
    .select('sku')
    .order('sku', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`Failed to fetch SKU: ${error.message}`)
  }

  // If no parts exist, start with SKU-001
  if (!data || data.length === 0) {
    return 'SKU-001'
  }

  // Extract number from last SKU and increment
  const lastSku = data[0].sku
  const match = lastSku.match(/SKU-(\d+)/)
  
  if (!match) {
    // If format is unexpected, start with SKU-001
    return 'SKU-001'
  }

  const lastNumber = parseInt(match[1], 10)
  const nextNumber = lastNumber + 1
  return `SKU-${nextNumber.toString().padStart(3, '0')}`
}
