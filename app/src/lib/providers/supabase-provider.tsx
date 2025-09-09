'use client'

/**
 * Supabase Store Provider
 * Simple wrapper that uses Zustand store instead of React Context
 * This ensures we don't create multiple clients unnecessarily
 */

import { type ReactNode } from 'react'
import { useSupabaseStore } from '@/lib/stores/supabase-store'
import React from 'react'

interface SupabaseProviderProps {
  children: ReactNode
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  // Initialize the store when the provider mounts
  const initialize = useSupabaseStore((state) => state.initialize)
  
  // Call initialize when component mounts
  React.useEffect(() => {
    initialize()
  }, [initialize])
  
  return <>{children}</>
}

// Re-export the store hooks for backward compatibility
export { 
  useSupabaseStore,
  useSupabaseClient,
  useSupabaseIsReady,
  useSupabaseClientRequired,
  useSupabaseForceRecreate
} from '@/lib/stores/supabase-store'

// Legacy context export (deprecated - use store hooks instead)
export const SupabaseContext = null
