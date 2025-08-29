'use client'

/**
 * Supabase Store Provider
 * Simple wrapper that uses Zustand store instead of React Context
 * This ensures we don't create multiple clients unnecessarily
 */

import { type ReactNode } from 'react'
import { useSupabaseStore } from '@/lib/stores/supabase-store'

interface SupabaseProviderProps {
  children: ReactNode
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  // Initialize the store when the provider mounts
  useSupabaseStore((state) => state.initialize)
  
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
