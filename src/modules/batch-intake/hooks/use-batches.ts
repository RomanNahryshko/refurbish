'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesApi } from '@/lib/api/batches'
import { useToast } from '@/lib/hooks/use-toast'

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

export function useCreateBatch() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: batchesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      toast.success({
        title: 'Success',
        description: 'Batch created successfully',
      })
    },
    onError: () => {
      toast.error({
        title: 'Error',
        description: 'Failed to create batch',
      })
    },
  })
}