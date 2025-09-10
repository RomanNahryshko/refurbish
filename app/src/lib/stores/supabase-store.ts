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
    console.log('🔄 SupabaseStore: Initializing...')
    const supabaseClient = createSupabaseClient()
    console.log('🔄 SupabaseStore: Client created:', !!supabaseClient)

    if (supabaseClient) {
      set({ client: supabaseClient, isReady: true })
      console.log('✅ SupabaseStore: Client set, getting session...')

      // Get initial session
      supabaseClient.auth.getSession().then(({ data: { session }, error }: { data: { session: Session | null }, error: any }) => {
        if (error) {
          console.error('❌ SupabaseStore: Session error:', error)
        } else {
          console.log('✅ SupabaseStore: Session retrieved:', !!session?.user)
        }
        set({ user: session?.user ?? null })
      }).catch((error) => {
        console.error('❌ SupabaseStore: Session fetch failed:', error)
      })

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabaseClient.auth.onAuthStateChange((event: string, session: Session | null) => {
        console.log('🔄 SupabaseStore: Auth state changed:', event, !!session?.user)
        set({ user: session?.user ?? null })
      })

      // Store subscription for cleanup
      get().cleanup = () => subscription.unsubscribe()
    } else {
      console.error('❌ SupabaseStore: Failed to create client - check environment variables')
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

// Initialize the store when imported
if (typeof window !== 'undefined') {
  useSupabaseStore.getState().initialize()
}

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
