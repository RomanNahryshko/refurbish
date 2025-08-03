import { createBrowserClient } from '@supabase/ssr'

import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '../supabase'

// Singleton instance to prevent multiple clients
let browserClient: ReturnType<typeof createBrowserClient> | null = null

// Create a Supabase client for use in the browser
export function createClient() {
  if (!hasValidSupabaseConfig) {
    // Return a mock client that won't crash the app
    console.warn('Supabase client not configured properly')
    return null as any
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