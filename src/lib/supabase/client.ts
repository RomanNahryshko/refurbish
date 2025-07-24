import { createBrowserClient } from '@supabase/ssr'

import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '../supabase'

// Create a Supabase client for use in the browser
export function createClient() {
  if (!hasValidSupabaseConfig) {
    // Return a mock client that won't crash the app
    console.warn('Supabase client not configured properly')
    return null as any
  }
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
} 