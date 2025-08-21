import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '../supabase'

// Get service role key from environment
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create a Supabase client for use in Server Components
// Uses service role key for full database access (since we don't have RLS)
export async function createSupabaseServerClient() {
  if (!hasValidSupabaseConfig) {
    // Return a mock client that won't crash the app
    console.warn('Supabase server client not configured properly')
    return null as unknown as SupabaseClient
  }

  const cookieStore = await cookies()

  // Use service role key if available (for database access without RLS)
  // Fall back to anon key for auth operations
  const key = supabaseServiceRoleKey || supabaseAnonKey

  return createServerClient(
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
} 