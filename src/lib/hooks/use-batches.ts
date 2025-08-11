import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesApi } from '@/lib/api/batches'
import { toast } from 'sonner'

// Query keys for batches
export const batchKeys = {
  all: ['batches'] as const,
  lists: () => [...batchKeys.all, 'list'] as const,
  list: (filters: string) => [...batchKeys.lists(), { filters }] as const,
  details: () => [...batchKeys.all, 'detail'] as const,
  detail: (id: string) => [...batchKeys.details(), id] as const,
}

// Hook to get all batches
export function useBatches() {
  return useQuery({
    queryKey: batchKeys.lists(),
    queryFn: () => batchesApi.getAll(),
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Refetch on every mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  })
}

// Hook to get batches with device counts
export function useBatchesWithDeviceCounts() {
  return useQuery({
    queryKey: [...batchKeys.lists(), 'with-counts'],
    queryFn: () => batchesApi.getAllWithDeviceCounts(),
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Refetch on every mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  })
}

// Hook to get a single batch by ID
export function useBatch(id: string) {
  return useQuery({
    queryKey: batchKeys.detail(id),
    queryFn: () => batchesApi.getById(id),
    enabled: !!id,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Refetch on every mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  })
}

// Hook to get batch with devices
export function useBatchWithDevices(id: string) {
  return useQuery({
    queryKey: [...batchKeys.detail(id), 'with-devices'],
    queryFn: () => batchesApi.getBatchWithDevices(id),
    enabled: !!id,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Refetch on every mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  })
}

// Hook to create a new batch
export function useCreateBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: batchesApi.create,
    onSuccess: () => {
      // Invalidate and refetch batches lists
      queryClient.invalidateQueries({ queryKey: batchKeys.lists() })
      toast.success('Batch created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create batch: ${error.message}`)
    },
  })
}

// Hook to update a batch
export function useUpdateBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof batchesApi.update>[1] }) =>
      batchesApi.update(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate and refetch specific batch and lists
      queryClient.invalidateQueries({ queryKey: batchKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: batchKeys.lists() })
      toast.success('Batch updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update batch: ${error.message}`)
    },
  })
}

// Hook to delete a batch
export function useDeleteBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: batchesApi.delete,
    onSuccess: () => {
      // Invalidate and refetch batches lists
      queryClient.invalidateQueries({ queryKey: batchKeys.lists() })
      toast.success('Batch deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete batch: ${error.message}`)
    },
  })
}


