import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '../supabase'

// Create a Supabase client for use in Server Components
// Uses anon key for auth operations to properly handle user sessions
export async function createSupabaseServerClient() {
  if (!hasValidSupabaseConfig) {
    console.error('❌ Server Supabase: Invalid configuration')
    // Return a mock client that won't crash the app
    return null as unknown as SupabaseClient
  }

  console.log('🔧 Server Supabase: Creating client with anon key for auth operations')

  // Always use anon key for auth operations to properly handle user sessions
  // Service role key bypasses auth and won't work for user authentication
  const key = supabaseAnonKey

  const cookieStore = await cookies()
  
  // Log cookies for debugging
  const allCookies = cookieStore.getAll()
  console.log('🍪 Server Supabase: Cookies available:', allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })))

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
          } catch (error) {
            console.warn('⚠️ Server Supabase: Cookie setAll error:', error)
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  console.log('✅ Server Supabase: Client created successfully')
  return client
}

// Alternative function to get the singleton instance directly
export function getSupabaseServerClient(): SupabaseClient | null {
  return null // No longer using singleton pattern
} 