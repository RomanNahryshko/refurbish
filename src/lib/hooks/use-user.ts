import { useQuery } from '@tanstack/react-query'
import { useSupabaseClient } from './use-supabase-client'

async function getCurrentUser(supabase: ReturnType<typeof useSupabaseClient>) {
  if (!supabase) return null
  
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function useUser() {
  const supabase = useSupabaseClient()
  
  return useQuery({
    queryKey: ['user'],
    queryFn: () => getCurrentUser(supabase),
    staleTime: 5 * 60 * 1000, // 5 minutes - user auth doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    refetchOnMount: false,
    retry: 2,
    enabled: !!supabase, // Only run query if client is available
  })
}
