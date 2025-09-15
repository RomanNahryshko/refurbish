import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '../supabase'

// Singleton instance to prevent multiple clients
let browserClient: SupabaseClient | null = null

/**
 * Optimized Supabase client singleton for browser
 * Creates client only once and reuses it for all subsequent calls
 * This prevents unnecessary client creation and reduces load on Supabase
 */
export function createSupabaseClient() {
  
  if (!hasValidSupabaseConfig) {
    // Return a mock client that won't crash the app
    return null
  }
  
  // Return existing client if already created
  if (browserClient) {
    return browserClient
  }
  
  // Create new client only once
  browserClient = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  ) as unknown as SupabaseClient
  
  console.log('✅ createSupabaseClient: New client created successfully')
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
}

/**
 * Global reset function for Supabase client
 * This can be called from anywhere to force client recreation
 */
export function globalResetSupabaseClient(): void {
  resetSupabaseClient()
}

// Make reset function available globally for logout scenarios
if (typeof window !== 'undefined') {
  // @ts-expect-error - Supabase client reset function is not typed
  window.__SUPABASE_CLIENT_RESET__ = globalResetSupabaseClient
} 