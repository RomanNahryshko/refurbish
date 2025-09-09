import { useSupabaseStore } from '@/lib/stores/supabase-store'

export function useUser() {
  const user = useSupabaseStore((state) => state.user)
  const isReady = useSupabaseStore((state) => state.isReady)
  
  return {
    user,
    isLoading: !isReady,
    isError: false
  }
}
