import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Batch } from '@/lib/types/business-types'

// Dynamic import to avoid circular dependency issues
async function getBatchesApi() {
  const { batchesApi } = await import('@/lib/api/batches')
  return batchesApi
}

export function useBatches() {
  return useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const api = await getBatchesApi()
      return api.getAll()
    },
    staleTime: 0, // Always consider data stale - refetch on every mount
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
  })
}

export function useBatch(id: string) {
  return useQuery({
    queryKey: ['batches', id],
    queryFn: async () => {
      const api = await getBatchesApi()
      return api.getById(id)
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes - individual batches change less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    refetchOnMount: false,
  })
}

export function useBatchesWithDeviceCounts() {
  return useQuery({
    queryKey: ['batches', 'with-device-counts'],
    queryFn: async () => {
      const api = await getBatchesApi()
      return api.getAllWithDeviceCounts()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - batches don't change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: false, // Don't refetch on mount if data exists
  })
}

export function useCreateBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (batchData: any) => {
      const api = await getBatchesApi()
      return api.create(batchData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })
}

export function useUpdateBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Batch> }) => {
      const api = await getBatchesApi()
      return api.update(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['batches', id] })
    },
  })
}

export function useDeleteBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const api = await getBatchesApi()
      return api.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })
}


