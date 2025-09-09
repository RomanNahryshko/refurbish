import { createInventoryAPI } from './inventory'
import { createStockAdjustmentsAPI } from './stock-adjustments'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Centralized API factory that uses singleton Supabase client
 * This ensures we don't create new clients for each request
 */
class APIFactory {
  private supabase: SupabaseClient | null = null

  /**
   * Get or create the Supabase client instance
   */
  private async getSupabaseClient(): Promise<SupabaseClient> {
    if (!this.supabase) {
      this.supabase = await createSupabaseServerClient()
    }
    
    if (!this.supabase) {
      throw new Error('Failed to create Supabase client')
    }
    
    return this.supabase
  }

  /**
   * Get Inventory API instance
   */
  async getInventoryAPI() {
    const client = await this.getSupabaseClient()
    return createInventoryAPI(client)
  }

  /**
   * Get Stock Adjustments API instance
   */
  async getStockAdjustmentsAPI() {
    const client = await this.getSupabaseClient()
    return createStockAdjustmentsAPI(client)
  }

  // Add other API methods as needed
  // async getBatchesAPI() {
  //   const client = await this.getSupabaseClient()
  //   return createBatchesAPI(client)
  // }
}

// Export singleton instance
export const apiFactory = new APIFactory()
