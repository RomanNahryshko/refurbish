import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '../supabase'

// Service role key for server-side operations that need full access
const _supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create a Supabase client for use in Server Components
// Uses anon key for auth operations to properly handle user sessions
export async function createSupabaseServerClient() {
  if (!hasValidSupabaseConfig) {
    // Return a mock client that won't crash the app
    return null as unknown as SupabaseClient
  }

  // Always use anon key for auth operations to properly handle user sessions
  // Service role key bypasses auth and won't work for user authentication
  const key = supabaseAnonKey

  const cookieStore = await cookies()

  const client = createServerClient(
    supabaseUrl,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  return client
}

// Alternative function to get the singleton instance directly
export function getSupabaseServerClient(): SupabaseClient | null {
  return null // No longer using singleton pattern
} 