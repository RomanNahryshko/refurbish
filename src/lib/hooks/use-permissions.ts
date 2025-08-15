import { useQuery } from '@tanstack/react-query'
import { getUserPermissions } from '@/lib/services/permissions'

export function usePermissions(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => getUserPermissions(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
    refetchOnMount: false,
    retry: 2,
  })
}

export function usePermissionCheck(
  userId: string | undefined,
  tableName: string,
  action: 'create' | 'read' | 'update' | 'delete'
) {
  const { data: permissions, isLoading, error } = usePermissions(userId)
  
  const hasPermission = permissions?.includes(`${tableName}:${action}`) ?? false
  
  return {
    hasPermission,
    isLoading,
    error,
    permissions
  }
}
