import { createBrowserClient } from '@supabase/ssr'

import { supabaseUrl, supabaseAnonKey } from '../supabase'

// Create a Supabase client for use in the browser
export function createClient() {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
} 