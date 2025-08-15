import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesApi } from '@/lib/api/batches'
import { Batch } from '@/lib/types/business-types'

export function useBatches() {
  return useQuery({
    queryKey: ['batches'],
    queryFn: batchesApi.getAll,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: false,
  })
}

export function useBatch(id: string) {
  return useQuery({
    queryKey: ['batches', id],
    queryFn: () => batchesApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes - individual batches change less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    refetchOnMount: false,
  })
}

export function useBatchesWithDeviceCounts() {
  return useQuery({
    queryKey: ['batches', 'with-device-counts'],
    queryFn: batchesApi.getAllWithDeviceCounts,
    staleTime: 2 * 60 * 1000, // 2 minutes - batches don't change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: false, // Don't refetch on mount if data exists
  })
}

export function useCreateBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: batchesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })
}

export function useUpdateBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Batch> }) =>
      batchesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['batches', id] })
    },
  })
}

export function useDeleteBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: batchesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })
}


