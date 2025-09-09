'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateUserData, UpdateUserData, UserFilters, UserWithAuth } from '@/lib/api/users'
import { useToast } from '@/lib/hooks/use-toast'

/**
 * Hook to fetch all users with filters
 */
export function useUsers(filters?: UserFilters) {
  return useQuery<UserWithAuth[]>({
    queryKey: ['users', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.role) params.append('role', filters.role)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.search) params.append('search', filters.search)
      
      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch users')
      }
      return response.json()
    },
  })
}

/**
 * Hook to fetch a single user
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }
      return response.json()
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ userData, performedBy }: { userData: CreateUserData; performedBy: string }) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userData, performedBy }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] })
      
      toast.success({
        title: 'User Created',
        description: `User created successfully. Temporary password: ${data.temporaryPassword}`,
      })
    },
    onError: (error: Error) => {
      toast.error({
        title: 'Creation Failed',
        description: error.message,
      })
    },
  })
}

/**
 * Hook to update user information
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ 
      userId, 
      userData, 
      performedBy 
    }: { 
      userId: string; 
      userData: UpdateUserData; 
      performedBy: string 
    }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userData, performedBy }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Update the specific user in cache
      queryClient.setQueryData(['users', variables.userId], data)
      
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] })
      
      toast.success({
        title: 'User Updated',
        description: 'User updated successfully',
      })
    },
    onError: (error: Error) => {
      toast.error({
        title: 'Update Failed',
        description: error.message,
      })
    },
  })
}

/**
 * Hook to update user status (enable/disable)
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ 
      userId, 
      status, 
      performedBy 
    }: { 
      userId: string; 
      status: 'active' | 'disabled'; 
      performedBy: string 
    }) => {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, performedBy }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user status')
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Update the specific user in cache
      queryClient.setQueryData(['users', variables.userId], data)
      
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['users'] })
      
      const action = variables.status === 'active' ? 'enabled' : 'disabled'
      toast.success({
        title: 'Status Updated',
        description: `User ${action} successfully`,
      })
    },
    onError: (error: Error) => {
      toast.error({
        title: 'Status Update Failed',
        description: error.message,
      })
    },
  })
}

/**
 * Hook to reset user password
 */
export function useResetUserPassword() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ 
      userId, 
      email, 
      performedBy 
    }: { 
      userId: string; 
      email: string; 
      performedBy: string 
    }) => {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, performedBy }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reset password')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate user data to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] })
      
      toast.success({
        title: 'Password Reset',
        description: `Password reset successfully. New temporary password: ${data.temporaryPassword}`,
      })
    },
    onError: (error: Error) => {
      toast.error({
        title: 'Password Reset Failed',
        description: error.message,
      })
    },
  })
}

// useUserAuditLogs hook removed - not in MVP scope