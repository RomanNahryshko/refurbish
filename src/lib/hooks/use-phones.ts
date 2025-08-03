'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { phonesApi } from '@/lib/api/phones'
import { PhoneFilters, PhoneStatus, Phone } from '@/lib/types/business-types'
import { useToast } from '@/lib/hooks/use-toast'

/**
 * Hook to fetch all phones with filters
 */
export function usePhones(filters?: PhoneFilters) {
  return useQuery({
    queryKey: ['phones', filters],
    queryFn: () => phonesApi.getAll(filters),
  })
}

/**
 * Hook to fetch a single phone
 */
export function usePhone(id: string) {
  return useQuery({
    queryKey: ['phones', id],
    queryFn: () => phonesApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to update phone status with optimistic updates
 */
export function useUpdatePhoneStatus() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PhoneStatus }) =>
      phonesApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['phones'] })

      // Snapshot the previous value
      const previousPhones = queryClient.getQueryData(['phones'])

      // Optimistically update to the new value
      queryClient.setQueryData(['phones'], (old: Phone[]) => {
        if (!old) return old
        return old.map((phone: Phone) =>
          phone.id === id ? { ...phone, status } : phone
        )
      })

      // Return a context with the previous and new data
      return { previousPhones }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousPhones) {
        queryClient.setQueryData(['phones'], context.previousPhones)
      }
      toast.error({
        title: 'Error',
        description: 'Failed to update phone status',
      })
    },
    onSuccess: () => {
      toast.success({
        title: 'Success',
        description: 'Phone status updated successfully',
      })
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['phones'] })
    },
  })
}

/**
 * Hook to create a new phone
 */
export function useCreatePhone() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: phonesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phones'] })
      toast.success({
        title: 'Success',
        description: 'Phone created successfully',
      })
    },
    onError: () => {
      toast.error({
        title: 'Error',
        description: 'Failed to create phone',
      })
    },
  })
}