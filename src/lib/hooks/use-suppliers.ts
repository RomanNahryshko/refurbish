import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSuppliersAPI, type CreateSupplierData } from '@/lib/api/suppliers'
import { useSupabaseContext } from '@/lib/providers/supabase-provider'
import { toast } from 'sonner'

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
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: supplierKeys.lists(),
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const suppliersApi = createSuppliersAPI(client)
      return suppliersApi.getAll()
    },
    enabled: isReady && !!client,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get suppliers by type
export function useSuppliersByType(type: 'devices' | 'parts' | 'both') {
  const { client, isReady } = useSupabaseContext()
  
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
  const { client, isReady } = useSupabaseContext()
  
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
  const { client, isReady } = useSupabaseContext()
  
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
  const { client } = useSupabaseContext()

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
  const { client } = useSupabaseContext()

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
  const { client } = useSupabaseContext()

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

