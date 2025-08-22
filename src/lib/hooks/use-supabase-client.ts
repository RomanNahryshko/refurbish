/**
 * Optimized Supabase client hook
 * Ensures we use the singleton client pattern throughout the app
 */

import { useContext } from 'react'
import { SupabaseContext } from '@/lib/providers/supabase-provider'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Hook to get the singleton Supabase client from context
 * Returns the same client instance across all components/hooks
 */
export function useSupabaseClient(): SupabaseClient | null {
  const context = useContext(SupabaseContext)
  return context?.client || null
}

/**
 * Hook to get the Supabase client with error handling
 * Throws an error if client is not available
 */
export function useSupabaseClientRequired(): SupabaseClient {
  const context = useContext(SupabaseContext)
  
  if (!context) {
    throw new Error('useSupabaseClientRequired must be used within a SupabaseProvider')
  }
  
  if (!context.client) {
    throw new Error('Supabase client is not available. Check your configuration.')
  }
  
  return context.client
}
