import { useQuery } from '@tanstack/react-query'
import { createSupabaseClient } from '@/lib/supabase/client'

async function getCurrentUser() {
  const supabase = createSupabaseClient()
  if (!supabase) return null
  
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes - user auth doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    refetchOnMount: false,
    retry: 2,
  })
}
