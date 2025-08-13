import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesApi } from '@/lib/api/batches'
import { Batch } from '@/lib/types/business-types'

export function useBatches() {
  return useQuery({
    queryKey: ['batches'],
    queryFn: batchesApi.getAll,
  })
}

export function useBatch(id: string) {
  return useQuery({
    queryKey: ['batches', id],
    queryFn: () => batchesApi.getById(id),
    enabled: !!id,
  })
}

export function useBatchesWithDeviceCounts() {
  return useQuery({
    queryKey: ['batches', 'with-device-counts'],
    queryFn: batchesApi.getAllWithDeviceCounts,
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


