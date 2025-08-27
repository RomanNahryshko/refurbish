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
  console.log('🔧 createSupabaseClient: Starting client creation...')
  
  if (!hasValidSupabaseConfig) {
    console.error('❌ createSupabaseClient: Invalid Supabase configuration')
    // Return a mock client that won't crash the app
    return null
  }
  
  console.log('✅ createSupabaseClient: Configuration valid')
  
  // Return existing client if already created
  if (browserClient) {
    console.log('🔄 createSupabaseClient: Returning existing client')
    return browserClient
  }
  
  console.log('🆕 createSupabaseClient: Creating new client...')
  
  // Create new client only once
  browserClient = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
  
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
  // @ts-ignore
  window.__SUPABASE_CLIENT_RESET__ = globalResetSupabaseClient
} 