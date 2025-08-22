import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Device, DeviceStatus, DeviceGrade, DeviceFormData, CreateDeviceData } from '@/lib/types/business-types'
import { useSupabaseContext } from '@/lib/providers/supabase-provider'
import { createDevicesAPI } from '@/lib/api/devices'

export function useDevices() {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getAll()
    },
    enabled: isReady && !!client,
    staleTime: 0, // Always consider data stale - refetch on every mount
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
  })
}

export function useDevice(id: string) {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['devices', id],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getById(id)
    },
    enabled: isReady && !!client && !!id,
  })
}

export function useDeviceByInternalId(internalId: string) {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['devices', 'internal', internalId],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getByInternalId(internalId)
    },
    enabled: isReady && !!client && !!internalId,
  })
}

export function useDevicesByBatch(batchId: string) {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['devices', 'batch', batchId],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getByBatchId(batchId)
    },
    enabled: isReady && !!client && !!batchId,
    staleTime: 0, // Always consider data stale - refetch on every mount
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
  })
}

export function useDevicesForFinalQC() {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['devices', 'final-qc'],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getDevicesForFinalQC()
    },
    enabled: isReady && !!client,
    staleTime: 0, // Always consider data stale - refetch on every mount
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
  })
}

export function useQCChecks(deviceIds?: string[], options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true
  const { client, isReady } = useSupabaseContext()
  
  // Only enable query if we have device IDs and they're not empty
  const shouldEnable = enabled && !!deviceIds && deviceIds.length > 0 && isReady && !!client
  
  return useQuery({
    queryKey: ['qc-checks', deviceIds],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getQCChecks(deviceIds)
    },
    enabled: shouldEnable,
    staleTime: 5 * 60 * 1000, // 5 minutes - QC checks don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    refetchOnMount: false,
    retry: 2,
  })
}

export function useCreateDevice() {
  const queryClient = useQueryClient()
  const { client } = useSupabaseContext()
  
  return useMutation({
    mutationFn: async (deviceData: DeviceFormData) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.create(deviceData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useUpdateDevice() {
  const queryClient = useQueryClient()
  const { client } = useSupabaseContext()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Device> }) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.update(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', id] })
    },
  })
}

export function useDeleteDevice() {
  const queryClient = useQueryClient()
  const { client } = useSupabaseContext()
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useUpdateDeviceStatus() {
  const queryClient = useQueryClient()
  const { client } = useSupabaseContext()
  
  return useMutation({
    mutationFn: async ({ id, status, grade }: { id: string; status: DeviceStatus; grade?: DeviceGrade }) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.updateStatus(id, status, grade)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', id] })
    },
  })
}

export function useBulkCreateDevices() {
  const queryClient = useQueryClient()
  const { client } = useSupabaseContext()
  
  return useMutation({
    mutationFn: async (devicesData: DeviceFormData[]) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.bulkCreate(devicesData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useBulkUpdateDevices() {
  const queryClient = useQueryClient()
  const { client } = useSupabaseContext()
  
  return useMutation({
    mutationFn: async (updates: { id: string; data: Partial<Device> }[]) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.bulkUpdate(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useDeviceCountByStatus(status: DeviceStatus) {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['devices', 'count', 'status', status],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getCountByStatus(status)
    },
    enabled: isReady && !!client,
    staleTime: 2 * 60 * 1000, // 2 minutes - counts change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
  })
}

export function useDeviceCountByBatch(batchId: string) {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['devices', 'count', 'batch', batchId],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getCountByBatch(batchId)
    },
    enabled: isReady && !!client && !!batchId,
    staleTime: 2 * 60 * 1000, // 2 minutes - counts change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
  })
}

export function useDeviceStatusHistory(deviceId: string) {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['device-status-history', deviceId],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getDeviceStatusHistory(deviceId)
    },
    enabled: isReady && !!client && !!deviceId,
    staleTime: 0, // Always consider data stale - refetch on every mount
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
  })
}

export function useCreateDevicesFromImport() {
  const queryClient = useQueryClient()
  const { client } = useSupabaseContext()
  
  return useMutation({
    mutationFn: async (devicesData: CreateDeviceData[]) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.bulkCreate(devicesData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })
}


