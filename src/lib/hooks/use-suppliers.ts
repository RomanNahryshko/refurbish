import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersApi, type CreateSupplierData } from '@/lib/api/suppliers'
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
  return useQuery({
    queryKey: supplierKeys.lists(),
    queryFn: () => suppliersApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get suppliers by type
export function useSuppliersByType(type: 'devices' | 'parts' | 'both') {
  return useQuery({
    queryKey: [...supplierKeys.lists(), 'by-type', type],
    queryFn: () => suppliersApi.getByType(type),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get device suppliers (for batch forms)
export function useDeviceSuppliers() {
  return useQuery({
    queryKey: [...supplierKeys.lists(), 'device-suppliers'],
    queryFn: () => suppliersApi.getByType('devices'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get a single supplier by ID
export function useSupplier(id: string) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => suppliersApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to create a new supplier
export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      // Invalidate and refetch suppliers lists
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
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

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSupplierData> }) =>
      suppliersApi.update(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate and refetch specific supplier and lists
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
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

  return useMutation({
    mutationFn: suppliersApi.delete,
    onSuccess: () => {
      // Invalidate and refetch suppliers lists
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
      toast.success('Supplier deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete supplier: ${error.message}`)
    },
  })
}

