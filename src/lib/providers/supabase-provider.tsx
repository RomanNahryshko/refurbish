'use client'

/**
 * Supabase Client Provider
 * Provides singleton Supabase client through React Context
 * This ensures we don't create multiple clients unnecessarily
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

interface SupabaseContextType {
  client: SupabaseClient | null
  isReady: boolean
}

const SupabaseContext = createContext<SupabaseContextType>({
  client: null,
  isReady: false,
})

interface SupabaseProviderProps {
  children: ReactNode
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialize the singleton client
    const supabaseClient = createSupabaseClient()
    setClient(supabaseClient)
    setIsReady(true)
  }, [])

  return (
    <SupabaseContext.Provider value={{ client, isReady }}>
      {children}
    </SupabaseContext.Provider>
  )
}

/**
 * Hook to access the Supabase client from context
 */
export function useSupabaseContext(): SupabaseContextType {
  const context = useContext(SupabaseContext)
  
  if (!context) {
    throw new Error('useSupabaseContext must be used within a SupabaseProvider')
  }
  
  return context
}

/**
 * Hook to get the Supabase client with error handling
 */
export function useSupabaseClient(): SupabaseClient | null {
  const { client } = useSupabaseContext()
  return client
}

/**
 * Hook to get the Supabase client (throws if not available)
 */
export function useSupabaseClientRequired(): SupabaseClient {
  const { client, isReady } = useSupabaseContext()
  
  if (!isReady) {
    throw new Error('Supabase client is not ready yet')
  }
  
  if (!client) {
    throw new Error('Supabase client is not available. Check your configuration.')
  }
  
  return client
}
