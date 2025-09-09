import { type UserProfile } from '@/lib/types/business-types'

export interface UserState {
  // User data
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  
}

export interface UserActions {
  // Authentication actions
  setUser: (user: UserProfile | null) => void
  setAuthenticated: (authenticated: boolean) => void
  setLoading: (loading: boolean) => void
  
  // Utility actions
  clearUser: () => void
}

export type UserStore = UserState & UserActions
