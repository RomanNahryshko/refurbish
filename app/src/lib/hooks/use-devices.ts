'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Device, DeviceStatus, DeviceGrade } from '@/lib/types/business-types'
import { useToast } from '@/lib/hooks/use-toast'

interface DeviceFilters {
  status?: string
  type?: string
  brand?: string
  model?: string
  grade?: string
  batchId?: string
  search?: string
}

interface CreateDeviceData {
  imei: string
  brand: string
  model: string
  batch_id: string
  status?: DeviceStatus
  grade?: DeviceGrade
  notes?: string
}

export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  list: (filters: DeviceFilters) => [...deviceKeys.lists(), { filters }] as const,
  details: () => [...deviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceKeys.details(), id] as const,
  batch: (batchId: string) => [...deviceKeys.all, 'batch', batchId] as const,
  finalQC: () => [...deviceKeys.all, 'final-qc'] as const,
  count: (type: string, value: string) => [...deviceKeys.all, 'count', type, value] as const,
  history: (deviceId: string) => [...deviceKeys.all, 'history', deviceId] as const,
}

/**
 * Hook to fetch all devices with optional filters
 */
export function useDevices(filters?: DeviceFilters) {
  return useQuery<Device[]>({
    queryKey: deviceKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.type) params.append('type', filters.type)
      if (filters?.brand) params.append('brand', filters.brand)
      if (filters?.model) params.append('model', filters.model)
      if (filters?.grade) params.append('grade', filters.grade)
      if (filters?.batchId) params.append('batchId', filters.batchId)
      if (filters?.search) params.append('search', filters.search)
      
      const response = await fetch(`/api/devices?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch devices')
      }
      
      const { data } = await response.json()
      return data
    },
  })
}

/**
 * Hook to fetch a single device
 */
export function useDevice(id: string) {
  return useQuery<Device>({
    queryKey: deviceKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/devices/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch device')
      }
      
      const { data } = await response.json()
      return data
    },
    enabled: !!id,
  })
}

/**
 * Hook to fetch device by internal ID
 */
export function useDeviceByInternalId(internalId: string) {
  return useQuery<Device>({
    queryKey: [...deviceKeys.all, 'internal', internalId],
    queryFn: async () => {
      const response = await fetch(`/api/devices/internal/${internalId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch device')
      }
      
      const { data } = await response.json()
      return data
    },
    enabled: !!internalId,
  })
}

/**
 * Hook to fetch devices by batch
 */
export function useDevicesByBatch(batchId: string) {
  return useQuery<Device[]>({
    queryKey: deviceKeys.batch(batchId),
    queryFn: async () => {
      const response = await fetch(`/api/devices?batchId=${batchId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch batch devices')
      }
      
      const { data } = await response.json()
      return data
    },
    enabled: !!batchId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    retry: 2,
  })
}

/**
 * Hook to fetch devices for final QC (devices with status 'final_qc')
 */
export function useDevicesForFinalQC() {
  return useQuery<Device[]>({
    queryKey: deviceKeys.finalQC(),
    queryFn: async () => {
      const response = await fetch('/api/devices?status=final_qc', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch devices for final QC')
      }
      
      const { data } = await response.json()
      return data
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    retry: 2,
  })
}

/**
 * Hook to create a new device
 */
export function useCreateDevice() {
  const queryClient = useQueryClient()
  const toast = useToast()
  
  return useMutation({
    mutationFn: async (deviceData: CreateDeviceData) => {
      const response = await fetch('/api/devices', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceData),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create device')
      }
      
      const { data } = await response.json()
      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deviceKeys.all })
      toast.success({
        title: 'Success',
        description: 'Device created successfully',
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
 * Hook to update a device
 */
export function useUpdateDevice() {
  const queryClient = useQueryClient()
  const toast = useToast()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Device> }) => {
      const response = await fetch('/api/devices', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update device')
      }
      
      const { data: updatedDevice } = await response.json()
      return updatedDevice
    },
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: deviceKeys.all })
      await queryClient.invalidateQueries({ queryKey: deviceKeys.detail(id) })
      toast.success({
        title: 'Success',
        description: 'Device updated successfully',
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
 * Hook to delete a device
 */
export function useDeleteDevice() {
  const queryClient = useQueryClient()
  const toast = useToast()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/devices?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete device')
      }
      
      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deviceKeys.all })
      toast.success({
        title: 'Success',
        description: 'Device deleted successfully',
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
 * Hook to update device status
 */
export function useUpdateDeviceStatus() {
  const queryClient = useQueryClient()
  const toast = useToast()
  
  return useMutation({
    mutationFn: async ({ id, status, grade }: { id: string; status: DeviceStatus; grade?: DeviceGrade }) => {
      const response = await fetch('/api/devices/update-status', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ device_id: id, status, grade }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update device status')
      }
      
      const { data } = await response.json()
      return data
    },
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: deviceKeys.all })
      await queryClient.invalidateQueries({ queryKey: deviceKeys.detail(id) })
      toast.success({
        title: 'Success',
        description: 'Device status updated successfully',
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
 * Hook to bulk create devices
 */
export function useBulkCreateDevices() {
  const queryClient = useQueryClient()
  const toast = useToast()
  
  return useMutation({
    mutationFn: async (devicesData: CreateDeviceData[]) => {
      const response = await fetch('/api/devices', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ devices: devicesData }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create devices')
      }
      
      const { data } = await response.json()
      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deviceKeys.all })
      toast.success({
        title: 'Success',
        description: 'Devices created successfully',
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
 * Hook to get device count by status
 */
export function useDeviceCountByStatus(status: DeviceStatus) {
  return useQuery<number>({
    queryKey: deviceKeys.count('status', status),
    queryFn: async () => {
      const response = await fetch(`/api/devices/count?status=${status}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch device count')
      }
      
      const { data } = await response.json()
      return data.count
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to get device count by batch
 */
export function useDeviceCountByBatch(batchId: string) {
  return useQuery<number>({
    queryKey: deviceKeys.count('batch', batchId),
    queryFn: async () => {
      const response = await fetch(`/api/devices/count?batchId=${batchId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch device count')
      }
      
      const { data } = await response.json()
      return data.count
    },
    enabled: !!batchId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}