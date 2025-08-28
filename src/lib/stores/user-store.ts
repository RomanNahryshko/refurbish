import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { type UserStore } from '@/types/user-store'

export const useUserStore = create<UserStore>()(
  devtools(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Authentication actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Utility actions
      clearUser: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'user-store',
    }
  )
)

// Selector hooks for better performance
export const useUser = () => useUserStore((state) => state.user)
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated)
export const useIsLoading = () => useUserStore((state) => state.isLoading)

// Action hooks - fixed to avoid infinite loops
export const useSetUser = () => useUserStore((state) => state.setUser)
export const useSetAuthenticated = () => useUserStore((state) => state.setAuthenticated)
export const useSetLoading = () => useUserStore((state) => state.setLoading)
export const useClearUser = () => useUserStore((state) => state.clearUser)
