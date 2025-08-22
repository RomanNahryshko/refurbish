import type { SupabaseClient } from '@supabase/supabase-js'

// Enhanced types with better validation
export interface StockAdjustment {
  id: string
  spare_part_id: string
  adjustment_type: 'add' | 'remove' | 'correction'
  quantity: number
  reason?: string
  reference_number?: string
  performed_by?: string
  created_at: string
}

export interface CreateStockAdjustmentData {
  spare_part_id: string
  adjustment_type: 'add' | 'remove' | 'correction'
  quantity: number
  reason?: string
  reference_number?: string
}

// Additional types for better structure
export interface StockAdjustmentWithDetails extends StockAdjustment {
  spare_parts?: {
    name: string
    sku: string
  } | null
  user_profiles?: {
    full_name: string
  } | null
}

export interface StockValidationResult {
  isValid: boolean
  message?: string
  currentStock?: number
}

/**
 * Stock Adjustments API with dependency injection pattern
 * Accepts Supabase client as parameter to avoid creating multiple clients
 */
export class StockAdjustmentsAPI {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Add stock to a spare part
   */
  async addStock(data: CreateStockAdjustmentData & { adjustment_type: 'add' }): Promise<StockAdjustment> {
    try {
      // Validate input data
      const validation = this.validateAddStockData(data)
      if (!validation.isValid) {
        throw new Error(validation.message)
      }

      const { data: result, error } = await this.supabase
        .from('stock_adjustments')
        .insert({
          ...data,
          quantity: Math.abs(data.quantity), // Ensure positive for additions
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to add stock: ${error.message}`)
      }

      return result as StockAdjustment
    } catch (error) {
      console.error('Error in addStock:', error)
      throw error
    }
  }

  /**
   * Remove stock from a spare part
   */
  async removeStock(data: CreateStockAdjustmentData & { adjustment_type: 'remove' }): Promise<StockAdjustment> {
    try {
      // Validate input data
      if (data.quantity <= 0) {
        throw new Error('Quantity must be positive when removing stock')
      }

      // Check current stock level to prevent negative stock
      const { data: part, error: fetchError } = await this.supabase
        .from('spare_parts')
        .select('quantity_in_stock')
        .eq('id', data.spare_part_id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch current stock: ${fetchError.message}`)
      }

      if (part.quantity_in_stock < data.quantity) {
        throw new Error(`Cannot remove more stock than available. Current stock: ${part.quantity_in_stock}`)
      }

      const { data: result, error } = await this.supabase
        .from('stock_adjustments')
        .insert({
          ...data,
          quantity: -Math.abs(data.quantity), // Ensure negative for removals
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to remove stock: ${error.message}`)
      }

      return result as StockAdjustment
    } catch (error) {
      console.error('Error in removeStock:', error)
      throw error
    }
  }

  /**
   * Validate add stock data
   */
  private validateAddStockData(data: CreateStockAdjustmentData & { adjustment_type: 'add' }): StockValidationResult {
    if (data.quantity <= 0) {
      return {
        isValid: false,
        message: 'Quantity must be positive when adding stock'
      }
    }

    if (!data.reference_number) {
      return {
        isValid: false,
        message: 'Invoice/Reference number is required when adding stock'
      }
    }

    return { isValid: true }
  }

  /**
   * Make stock correction (can be positive or negative)
   */
  async correctStock(data: CreateStockAdjustmentData & { adjustment_type: 'correction' }): Promise<StockAdjustment> {
    try {
      // Insert the exact quantity the user entered without any modifications
      const { data: result, error } = await this.supabase
        .from('stock_adjustments')
        .insert(data)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to correct stock: ${error.message}`)
      }

      return result as StockAdjustment
    } catch (error) {
      console.error('Error in correctStock:', error)
      throw error
    }
  }

  /**
   * Create any type of stock adjustment with validation
   */
  async createAdjustment(data: CreateStockAdjustmentData) {
    switch (data.adjustment_type) {
      case 'add':
        return this.addStock(data as CreateStockAdjustmentData & { adjustment_type: 'add' })
      case 'remove':
        return this.removeStock(data as CreateStockAdjustmentData & { adjustment_type: 'remove' })
      case 'correction':
        return this.correctStock(data as CreateStockAdjustmentData & { adjustment_type: 'correction' })
      default:
        throw new Error('Invalid adjustment type')
    }
  }

  /**
   * Get stock adjustments for a specific part
   */
  async getAdjustmentsForPart(partId: string): Promise<StockAdjustmentWithDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from('stock_adjustments')
        .select(`
          *,
          spare_parts(name, sku),
          user_profiles:performed_by(full_name)
        `)
        .eq('spare_part_id', partId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch adjustments for part: ${error.message}`)
      }

      return data as StockAdjustmentWithDetails[]
    } catch (error) {
      console.error('Error in getAdjustmentsForPart:', error)
      throw error
    }
  }

  /**
   * Get all recent stock adjustments
   */
  async getRecentAdjustments(limit: number = 50): Promise<StockAdjustmentWithDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from('stock_adjustments')
        .select(`
          *,
          spare_parts(name, sku),
          user_profiles:performed_by(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Failed to fetch recent adjustments: ${error.message}`)
      }

      return data as StockAdjustmentWithDetails[]
    } catch (error) {
      console.error('Error in getRecentAdjustments:', error)
      throw error
    }
  }
}

/**
 * Factory function to create StockAdjustmentsAPI instance with client
 * This maintains backward compatibility while implementing dependency injection
 */
export function createStockAdjustmentsAPI(supabase: SupabaseClient): StockAdjustmentsAPI {
  return new StockAdjustmentsAPI(supabase)
}

/**
 * Legacy singleton instance for backward compatibility
 * @deprecated Use createStockAdjustmentsAPI() with dependency injection instead
 */
import { createSupabaseClient } from '@/lib/supabase/client'
export const stockAdjustmentsApi = new StockAdjustmentsAPI(createSupabaseClient()!)
