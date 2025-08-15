import { useQuery } from '@tanstack/react-query'

interface UserProfile {
  full_name?: string
  role?: string
}

async function fetchUserProfile(): Promise<UserProfile> {
  const response = await fetch('/api/user/profile')
  if (!response.ok) {
    throw new Error('Failed to fetch profile')
  }
  return response.json()
}

export function useProfile(enabled: boolean = true) {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchUserProfile,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - profile doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
    refetchOnMount: false,
    retry: 2,
  })
}
