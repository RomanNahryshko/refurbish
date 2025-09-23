'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Supplier } from '@/lib/types/business-types'
import { useToast } from '@/lib/hooks/use-toast'

interface SupplierFilters {
  type?: 'devices' | 'parts' | 'both'
  search?: string
}

interface CreateSupplierData {
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  supplier_type: 'devices' | 'parts' | 'both'
  notes?: string
}

export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (filters: SupplierFilters) => [...supplierKeys.lists(), { filters }] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const,
}

/**
 * Hook to get all suppliers with optional filters
 */
export function useSuppliers(filters?: SupplierFilters) {
  return useQuery<Supplier[]>({
    queryKey: supplierKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.type) params.append('type', filters.type)
      if (filters?.search) params.append('search', filters.search)
      
      const response = await fetch(`/api/suppliers?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch suppliers')
      }
      
      return response.json()
    },
  })
}

/**
 * Hook to get a single supplier
 */
export function useSupplier(id: string) {
  return useQuery<Supplier>({
    queryKey: supplierKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch supplier')
      }
      
      const { data } = await response.json()
      return data
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient()
  const toast = useToast()
  
  return useMutation({
    mutationFn: async (supplierData: CreateSupplierData) => {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create supplier')
      }
      
      const { data } = await response.json()
      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: supplierKeys.all })
      toast.success({
        title: 'Success',
        description: 'Supplier created successfully',
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
 * Hook to update a supplier
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  const toast = useToast()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Supplier> }) => {
      const response = await fetch('/api/suppliers', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update supplier')
      }
      
      const { data: updatedSupplier } = await response.json()
      return updatedSupplier
    },
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: supplierKeys.all })
      await queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) })
      toast.success({
        title: 'Success',
        description: 'Supplier updated successfully',
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
 * Hook to delete a supplier
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  const toast = useToast()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/suppliers?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete supplier')
      }
      
      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: supplierKeys.all })
      toast.success({
        title: 'Success',
        description: 'Supplier deleted successfully',
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