'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersApi, CreateSupplierData, UpdateSupplierData, SuppliersFilters } from '@/lib/api/suppliers-client'
import { toast } from 'sonner'

/**
 * Hook to fetch all suppliers with filters
 */
export function useSuppliersQuery(filters?: SuppliersFilters) {
  return useQuery({
    queryKey: ['suppliers', filters],
    queryFn: () => suppliersApi.getAll(filters),
  })
}

/**
 * Hook to fetch suppliers that provide parts (for inventory dropdowns)
 */
export function usePartsSuppliers() {
  return useQuery({
    queryKey: ['suppliers', 'parts'],
    queryFn: suppliersApi.getPartsSuppliers,
  })
}

/**
 * Hook to fetch a single supplier
 */
export function useSupplierQuery(id: string) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => suppliersApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new supplier
 */
export function useCreateSupplierMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (supplierData: CreateSupplierData) => suppliersApi.create(supplierData),
    onSuccess: (newSupplier) => {
      // Invalidate and refetch suppliers list
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      
      toast.success('Supplier created successfully', {
        description: `${newSupplier.name} has been added`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to create supplier', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to update supplier
 */
export function useUpdateSupplierMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, supplierData }: { id: string; supplierData: UpdateSupplierData }) => 
      suppliersApi.update(id, supplierData),
    onSuccess: (updatedSupplier, variables) => {
      // Update the specific supplier in cache
      queryClient.setQueryData(['suppliers', variables.id], updatedSupplier)
      
      // Invalidate suppliers list to refetch
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      
      toast.success('Supplier updated successfully', {
        description: `${updatedSupplier.name} has been updated`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to update supplier', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to delete supplier
 */
export function useDeleteSupplierMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => {
      // Invalidate suppliers list to refetch
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      
      toast.success('Supplier deleted successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to delete supplier', {
        description: error.message,
      })
    },
  })
}
