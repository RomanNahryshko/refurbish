import { create } from 'zustand'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'

interface SupabaseStore {
  client: SupabaseClient | null
  isReady: boolean
  user: User | null
  
  // Actions
  initialize: () => void
  setUser: (user: User | null) => void
  forceRecreateClient: () => void
  cleanup: () => void
}

export const useSupabaseStore = create<SupabaseStore>((set, get) => ({
  client: null,
  isReady: false,
  user: null,

  initialize: () => {
    const supabaseClient = createSupabaseClient()

    if (supabaseClient) {
      set({ client: supabaseClient, isReady: true })

      // Get initial session
      supabaseClient.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
        set({ user: session?.user ?? null })
      })

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabaseClient.auth.onAuthStateChange((event: string, session: Session | null) => {
        console.log('Auth state change:', event, session?.user?.id)
        set({ user: session?.user ?? null })
        
        // Handle sign out event
        if (event === 'SIGNED_OUT') {
          // Clear any cached data or perform cleanup
          console.log('User signed out, clearing state')
        }
      })

      // Store subscription for cleanup
      get().cleanup = () => subscription.unsubscribe()
    }
  },

  setUser: (user: User | null) => {
    set({ user })
  },

  forceRecreateClient: () => {
    const { cleanup } = get()
    
    // Cleanup existing subscription
    if (cleanup) {
      cleanup()
    }

    // Reset state
    set({ client: null, isReady: false, user: null })
    
    // Reinitialize after a short delay
    setTimeout(() => {
      get().initialize()
    }, 100)
  },

  cleanup: () => {
    // This will be set during initialization
  }
}))

// Store will be initialized by the provider

// Export convenience hooks
export const useSupabaseClient = () => useSupabaseStore((state) => state.client)
export const useSupabaseIsReady = () => useSupabaseStore((state) => state.isReady)

export const useSupabaseClientRequired = (): SupabaseClient => {
  const client = useSupabaseStore((state) => state.client)
  const isReady = useSupabaseStore((state) => state.isReady)
  
  if (!isReady) {
    throw new Error('Supabase client is not ready yet')
  }
  
  if (!client) {
    throw new Error('Supabase client is not available. Check your configuration.')
  }
  
  return client
}

export const useSupabaseForceRecreate = () => useSupabaseStore((state) => state.forceRecreateClient)
