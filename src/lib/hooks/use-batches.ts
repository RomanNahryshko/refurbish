import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Batch } from '@/lib/types/business-types'
import { useSupabaseContext } from '@/lib/providers/supabase-provider'
import { createBatchesAPI } from '@/lib/api/batches'

export function useBatches() {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const batchesApi = createBatchesAPI(client)
      return batchesApi.getAll()
    },
    enabled: isReady && !!client,
    staleTime: 0, // Always consider data stale - refetch on every mount
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
  })
}

export function useBatch(id: string) {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['batches', id],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const batchesApi = createBatchesAPI(client)
      return batchesApi.getById(id)
    },
    enabled: isReady && !!client && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes - individual batches change less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    refetchOnMount: false,
  })
}

export function useBatchesWithDeviceCounts() {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['batches', 'with-device-counts'],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const batchesApi = createBatchesAPI(client)
      return batchesApi.getAllWithDeviceCounts()
    },
    enabled: isReady && !!client,
    staleTime: 2 * 60 * 1000, // 2 minutes - batches don't change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: false, // Don't refetch on mount if data exists
  })
}

export function useCreateBatch() {
  const queryClient = useQueryClient()
  const { client } = useSupabaseContext()
  
  return useMutation({
    mutationFn: async (batchData: any) => {
      if (!client) throw new Error('Supabase client not available')
      const batchesApi = createBatchesAPI(client)
      return batchesApi.create(batchData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })
}

export function useUpdateBatch() {
  const queryClient = useQueryClient()
  const { client } = useSupabaseContext()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Batch> }) => {
      if (!client) throw new Error('Supabase client not available')
      const batchesApi = createBatchesAPI(client)
      return batchesApi.update(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['batches', id] })
    },
  })
}

export function useDeleteBatch() {
  const queryClient = useQueryClient()
  const { client } = useSupabaseContext()
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Supabase client not available')
      const batchesApi = createBatchesAPI(client)
      return batchesApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })
}


