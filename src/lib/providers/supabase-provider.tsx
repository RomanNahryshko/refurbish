'use client'

/**
 * Supabase Client Provider
 * Provides singleton Supabase client through React Context
 * This ensures we don't create multiple clients unnecessarily
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'

interface SupabaseContextType {
  client: SupabaseClient | null
  isReady: boolean
  user: User | null
  forceRecreateClient: () => void
}

const SupabaseContext = createContext<SupabaseContextType>({
  client: null,
  isReady: false,
  user: null,
  forceRecreateClient: () => {},
})

// Export the context for direct usage
export { SupabaseContext }

interface SupabaseProviderProps {
  children: ReactNode
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const forceRecreateClient = () => {
    // Reset the client state
    setClient(null)
    setIsReady(false)
    setUser(null)
    
    // Reinitialize after a short delay
    setTimeout(() => {
      const supabaseClient = createSupabaseClient()
      setClient(supabaseClient)
      setIsReady(true)

      if (supabaseClient) {
        // Get initial session
        supabaseClient.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
          setUser(session?.user ?? null)
        })

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabaseClient.auth.onAuthStateChange((_event: string, session: Session | null) => {
          setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
      }
    }, 100)
  }

  useEffect(() => {
    // Initialize the singleton client
    const supabaseClient = createSupabaseClient()
    setClient(supabaseClient)
    setIsReady(true)

    if (supabaseClient) {
      // Get initial session
      supabaseClient.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
        setUser(session?.user ?? null)
      })

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabaseClient.auth.onAuthStateChange((_event: string, session: Session | null) => {
        setUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  return (
    <SupabaseContext.Provider value={{ client, isReady, user, forceRecreateClient }}>
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
 * Hook to get the current user from context
 */
export function useSupabaseUser(): User | null {
  const { user } = useSupabaseContext()
  return user
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

/**
 * Hook to force recreate the Supabase client
 */
export function useSupabaseForceRecreate(): () => void {
  const { forceRecreateClient } = useSupabaseContext()
  return forceRecreateClient
}
