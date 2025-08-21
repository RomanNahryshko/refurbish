import { useQuery } from '@tanstack/react-query'
import { UserProfile } from '@/lib/types/business-types'

async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await fetch('/api/user/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't cache at the fetch level, let React Query handle it
      cache: 'no-store',
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated
        return null
      }
      throw new Error(`Failed to fetch profile: ${response.status}`)
    }
    
    return response.json()
  } catch (error) {
    throw error
  }
}

export function useProfile(enabled: boolean = true) {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchUserProfile,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - reduced from 10 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes in cache - reduced from 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false, // Don't refetch when window gets focus
    refetchOnReconnect: false, // Don't refetch when reconnecting
    retry: (failureCount, error) => {
      // Don't retry on 401 (unauthorized)
      if (error instanceof Error && error.message.includes('401')) {
        return false
      }
      // Only retry twice for other errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}

// Alternative hook for one-time profile fetching without caching
export function useProfileOnce(enabled: boolean = true) {
  return useQuery({
    queryKey: ['user-profile-once', Date.now()], // Unique key each time
    queryFn: fetchUserProfile,
    enabled,
    staleTime: 0, // Always consider stale
    gcTime: 0, // Don't cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false, // Don't retry
  })
}
