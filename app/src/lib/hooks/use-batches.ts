'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Batch } from '@/lib/types/business-types'
import { useToast } from '@/lib/hooks/use-toast'

interface BatchFilters {
  supplier_id?: string
  search?: string
}

interface CreateBatchData {
  supplier_id: string
  invoice_number?: string
  invoice_date?: string
  invoice_amount?: number
  device_count: number
  received_date?: string
  notes?: string
}

export const batchKeys = {
  all: ['batches'] as const,
  lists: () => [...batchKeys.all, 'list'] as const,
  list: (filters: BatchFilters) => [...batchKeys.lists(), { filters }] as const,
  details: () => [...batchKeys.all, 'detail'] as const,
  detail: (id: string) => [...batchKeys.details(), id] as const,
}

/**
 * Hook to get all batches with optional filters
 */
export function useBatches(filters?: BatchFilters) {
  return useQuery<Batch[]>({
    queryKey: batchKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.supplier_id) params.append('supplier_id', filters.supplier_id)
      if (filters?.search) params.append('search', filters.search)
      
      const response = await fetch(`/api/batches?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch batches')
      }
      
      const { data } = await response.json()
      return data
    },
  })
}

/**
 * Hook to get a single batch
 */
export function useBatch(id: string) {
  return useQuery<Batch>({
    queryKey: batchKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/batches/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch batch')
      }
      
      const { data } = await response.json()
      return data
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a new batch
 */
export function useCreateBatch() {
  const queryClient = useQueryClient()
  const toast = useToast()
  
  return useMutation({
    mutationFn: async (batchData: CreateBatchData) => {
      const response = await fetch('/api/batches', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchData),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create batch')
      }
      
      const { data } = await response.json()
      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: batchKeys.all })
      toast.success({
        title: 'Success',
        description: 'Batch created successfully',
      })
    },
    onError: (error) => {
      toast.error({
        title: 'Error',
        description: error.message,
      })
    },
  })
}

/**
 * Hook to update a batch
 */
export function useUpdateBatch() {
  const queryClient = useQueryClient()
  const toast = useToast()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Batch> }) => {
      const response = await fetch('/api/batches', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update batch')
      }
      
      const { data: updatedBatch } = await response.json()
      return updatedBatch
    },
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: batchKeys.all })
      await queryClient.invalidateQueries({ queryKey: batchKeys.detail(id) })
      toast.success({
        title: 'Success',
        description: 'Batch updated successfully',
      })
    },
    onError: (error) => {
      toast.error({
        title: 'Error',
        description: error.message,
      })
    },
  })
}

/**
 * Hook to delete a batch
 */
export function useDeleteBatch() {
  const queryClient = useQueryClient()
  const toast = useToast()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/batches?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete batch')
      }
      
      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: batchKeys.all })
      toast.success({
        title: 'Success',
        description: 'Batch deleted successfully',
      })
    },
    onError: (error) => {
      toast.error({
        title: 'Error',
        description: error.message,
      })
    },
  })
}

// Legacy hook for backward compatibility
export function useBatchesLegacy() {
  const { data: batches, isLoading: loading, error, refetch: fetchBatches } = useBatches()
  
  return {
    batches: batches || [],
    loading,
    error: error?.message || null,
    fetchBatches,
  }
}