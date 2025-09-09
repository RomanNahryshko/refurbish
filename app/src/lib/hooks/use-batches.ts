import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Batch, BatchCreationData } from '@/lib/types/business-types'
import { useSupabaseClient, useSupabaseIsReady } from '@/lib/stores/supabase-store'
import { createBatchesAPI } from '@/lib/api/batches'

export function useBatches() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()

  const fetchBatches = useCallback(async () => {
    if (!client || !isReady) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await client
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      setBatches(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch batches')
    } finally {
      setLoading(false)
    }
  }, [client, isReady])

  const createBatch = useCallback(async (batch: Omit<Batch, 'id' | 'created_at' | 'updated_at'>) => {
    if (!client || !isReady) return null
    
    try {
      const { data, error: createError } = await client
        .from('batches')
        .insert(batch)
        .select()
        .single()
      
      if (createError) throw createError
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch')
      return null
    }
  }, [client, isReady])

  const updateBatch = useCallback(async (id: string, updates: Partial<Batch>) => {
    if (!client) return null
    
    try {
      const { data, error: updateError } = await client
        .from('batches')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (updateError) throw updateError
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update batch')
      return null
    }
  }, [client])

  const deleteBatch = useCallback(async (id: string) => {
    if (!client) return false
    
    try {
      const { error: deleteError } = await client
        .from('batches')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete batch')
      return false
    }
  }, [client])

  return {
    batches,
    loading,
    error,
    fetchBatches,
    createBatch,
    updateBatch,
    deleteBatch,
  }
}

export function useBatch(id: string) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
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
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
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
  
  return useMutation({
    mutationFn: async (batchData: BatchCreationData) => {
      // Call our API endpoint instead of direct Supabase access
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create batch')
      }

      const result = await response.json()
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      // Also invalidate dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
  })
}

export function useUpdateBatch() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Batch> }) => {
      if (!client) throw new Error('Supabase client not available')
      const batchesApi = createBatchesAPI(client)
      return batchesApi.update(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })
}

export function useDeleteBatch() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()
  
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


