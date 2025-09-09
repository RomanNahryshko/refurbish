'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getAllParts,
    getPartById,
    getLowStockParts,
    createPart,
    updatePart,
    deletePart,
    createStockAdjustment, isSkuUnique,
    getNextSku,
    PartsFilters,
    CreateSparePartData,
    UpdateSparePartData,
    CreateStockAdjustmentData
} from '@/lib/api/inventory-client'
import { toast } from 'sonner'

/**
 * Hook to fetch all spare parts with filters
 */
export function usePartsQuery(filters?: PartsFilters) {
  return useQuery({
    queryKey: ['parts', filters],
    queryFn: () => getAllParts(filters),
  })
}

/**
 * Hook to fetch a single spare part
 */
export function usePartQuery(id: string) {
  return useQuery({
    queryKey: ['parts', id],
    queryFn: () => getPartById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch parts with low stock
 */
export function useLowStockQuery() {
  return useQuery({
    queryKey: ['parts', 'low-stock'],
    queryFn: getLowStockParts,
  })
}

/**
 * Hook to create a new spare part
 */
export function useCreatePartMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (partData: CreateSparePartData) => createPart(partData),
    onSuccess: (newPart) => {
      // Invalidate and refetch parts list
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      
      toast.success('Spare part created successfully', {
        description: `${newPart.name} (${newPart.sku}) has been added to inventory`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to create spare part', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to update spare part details
 */
export function useUpdatePartMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, partData }: { id: string; partData: UpdateSparePartData }) => 
      updatePart(id, partData),
    onSuccess: (updatedPart, variables) => {
      // Update the specific part in cache
      queryClient.setQueryData(['parts', variables.id], updatedPart)
      
      // Invalidate parts list to refetch
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      
      toast.success('Spare part updated successfully', {
        description: `${updatedPart.name} has been updated`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to update spare part', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to soft delete spare part
 */
export function useDeletePartMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePart(id),
    onSuccess: () => {
      // Invalidate parts list to refetch
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      
      toast.success('Spare part deleted successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to delete spare part', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to add stock adjustment
 */
export function useAddStockMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (adjustmentData: CreateStockAdjustmentData) => 
      createStockAdjustment(adjustmentData),
    onSuccess: (_, adjustmentData) => {
      // Invalidate parts data to show updated stock levels
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      
      const actionText = adjustmentData.adjustment_type === 'add' 
        ? 'added to' 
        : adjustmentData.adjustment_type === 'remove' 
          ? 'removed from' 
          : 'corrected for'
      
      toast.success('Stock adjustment completed', {
        description: `${Math.abs(adjustmentData.quantity)} units ${actionText} inventory`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to adjust stock', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to check SKU uniqueness
 */
export function useCheckSkuQuery(sku: string, excludeId?: string) {
  return useQuery({
    queryKey: ['parts', 'sku-check', sku, excludeId],
    queryFn: () => isSkuUnique(sku, excludeId),
    enabled: !!sku && sku.length > 0,
  })
}

/**
 * Hook to get next available SKU
 */
export function useNextSkuQuery() {
  return useQuery({
    queryKey: ['parts', 'next-sku'],
    queryFn: getNextSku,
  })
}
