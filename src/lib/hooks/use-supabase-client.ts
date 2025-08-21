/**
 * Optimized Supabase client hook
 * Ensures we use the singleton client pattern throughout the app
 */

import { useMemo } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Hook to get the singleton Supabase client
 * Returns the same client instance across all components/hooks
 */
export function useSupabaseClient(): SupabaseClient | null {
  const client = useMemo(() => {
    return createSupabaseClient()
  }, [])

  return client
}

/**
 * Hook to get the Supabase client with error handling
 * Throws an error if client is not available
 */
export function useSupabaseClientRequired(): SupabaseClient {
  const client = useSupabaseClient()
  
  if (!client) {
    throw new Error('Supabase client is not available. Check your configuration.')
  }
  
  return client
}
