import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSuppliersAPI, type CreateSupplierData } from '@/lib/api/suppliers'
import { useSupabaseClient, useSupabaseIsReady } from '@/lib/stores/supabase-store'
import { toast } from 'sonner'
import { useCallback, useState } from 'react'
import { Supplier } from '../api/suppliers-client'

// Query keys for suppliers
export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (filters: string) => [...supplierKeys.lists(), { filters }] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const,
}

// Hook to get all suppliers
export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()

  const fetchSuppliers = useCallback(async () => {
    if (!client || !isReady) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await client
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      setSuppliers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers')
    } finally {
      setLoading(false)
    }
  }, [client, isReady])

  const createSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    if (!client || !isReady) return null
    
    try {
      const { data, error: createError } = await client
        .from('suppliers')
        .insert(supplier)
        .select()
        .single()
      
      if (createError) throw createError
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supplier')
      return null
    }
  }, [client, isReady])

  const updateSupplier = useCallback(async (id: string, updates: Partial<Supplier>) => {
    if (!client || !isReady) return null
    
    try {
      const { data, error: updateError } = await client
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (updateError) throw updateError
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update supplier')
      return null
    }
  }, [client, isReady])

  const deleteSupplier = useCallback(async (id: string) => {
    if (!client) return false
    
    try {
      const { error: deleteError } = await client
        .from('suppliers')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete supplier')
      return false
    }
  }, [client])

  const getSupplierById = useCallback(async (id: string) => {
    if (!client) return null
    
    try {
      const { data, error: fetchError } = await client
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch supplier')
      return null
    }
  }, [client])

  const searchSuppliers = useCallback(async (query: string) => {
    if (!client) return []
    
    try {
      const { data, error: fetchError } = await client
        .from('suppliers')
        .select('*')
        .or(`name.ilike.%${query}%,contact_person.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search suppliers')
      return []
    }
  }, [client])

  const getSuppliersByCategory = useCallback(async (category: string) => {
    if (!client || !isReady) return []
    
    try {
      const { data, error: fetchError } = await client
        .from('suppliers')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers by category')
      return []
    }
  }, [client, isReady])

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierById,
    searchSuppliers,
    getSuppliersByCategory,
  }
}

// Hook to get suppliers by type
export function useSuppliersByType(type: 'devices' | 'parts' | 'both') {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: [...supplierKeys.lists(), 'by-type', type],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const suppliersApi = createSuppliersAPI(client)
      return suppliersApi.getByType(type)
    },
    enabled: isReady && !!client,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get device suppliers (for batch forms)
export function useDeviceSuppliers() {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: [...supplierKeys.lists(), 'device-suppliers'],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const suppliersApi = createSuppliersAPI(client)
      return suppliersApi.getByType('devices')
    },
    enabled: isReady && !!client,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get a single supplier by ID
export function useSupplier(id: string) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const suppliersApi = createSuppliersAPI(client)
      return suppliersApi.getById(id)
    },
    enabled: isReady && !!client && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to create a new supplier
export function useCreateSupplier() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()

  return useMutation({
    mutationFn: async (data: CreateSupplierData) => {
      if (!client) throw new Error('Supabase client not available')
      const suppliersApi = createSuppliersAPI(client)
      return suppliersApi.create(data)
    },
    onSuccess: () => {
      // Invalidate and refetch all suppliers queries
      queryClient.invalidateQueries({ queryKey: supplierKeys.all })
      toast.success('Supplier created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create supplier: ${error.message}`)
    },
  })
}

// Hook to update a supplier
export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateSupplierData> }) => {
      if (!client) throw new Error('Supabase client not available')
      const suppliersApi = createSuppliersAPI(client)
      return suppliersApi.update(id, data)
    },
    onSuccess: (_, { id }) => {
      // Invalidate and refetch specific supplier and all lists
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: supplierKeys.all })
      toast.success('Supplier updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update supplier: ${error.message}`)
    },
  })
}

// Hook to delete a supplier
export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Supabase client not available')
      const suppliersApi = createSuppliersAPI(client)
      return suppliersApi.delete(id)
    },
    onSuccess: () => {
      // Invalidate and refetch all suppliers queries
      queryClient.invalidateQueries({ queryKey: supplierKeys.all })
      toast.success('Supplier deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete supplier: ${error.message}`)
    },
  })
}

