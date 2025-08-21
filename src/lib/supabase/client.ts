import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '../supabase'

// Singleton instance to prevent multiple clients
let browserClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Optimized Supabase client singleton for browser
 * Creates client only once and reuses it for all subsequent calls
 * This prevents unnecessary client creation and reduces load on Supabase
 */
export function createSupabaseClient() {
  if (!hasValidSupabaseConfig) {
    // Return a mock client that won't crash the app
    console.warn('Supabase client not configured properly')
    return null as unknown as SupabaseClient
  }
  
  // Return existing client if already created
  if (browserClient) {
    return browserClient
  }
  
  // Create new client only once
  browserClient = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Supabase browser client created (singleton)')
  }
  
  return browserClient
}

/**
 * Get the existing Supabase client instance
 * Returns null if no client has been created yet
 */
export function getSupabaseClient(): SupabaseClient | null {
  return browserClient
}

/**
 * Force recreation of the Supabase client
 * Use only when absolutely necessary (e.g., config changes)
 */
export function resetSupabaseClient(): void {
  browserClient = null
  console.log('🔄 Supabase browser client reset')
} 