import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '../supabase'

// Singleton instance to prevent multiple clients
let browserClient: ReturnType<typeof createBrowserClient> | null = null

// Create a Supabase client for use in the browser
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
  
  // Create new client
  browserClient = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
  
  return browserClient
} 