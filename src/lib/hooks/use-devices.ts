import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Device, DeviceStatus, DeviceGrade, DeviceFormData } from '@/lib/types/business-types'

// Dynamic import to avoid circular dependency issues
async function getDevicesApi() {
  const { devicesApi } = await import('@/lib/api/devices')
  return devicesApi
}

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const api = await getDevicesApi()
      return api.getAll()
    },
    staleTime: 0, // Always consider data stale - refetch on every mount
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
  })
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ['devices', id],
    queryFn: async () => {
      const api = await getDevicesApi()
      return api.getById(id)
    },
    enabled: !!id,
  })
}

export function useDeviceByInternalId(internalId: string) {
  return useQuery({
    queryKey: ['devices', 'internal', internalId],
    queryFn: async () => {
      const api = await getDevicesApi()
      return api.getByInternalId(internalId)
    },
    enabled: !!internalId,
  })
}

export function useDevicesByBatch(batchId: string) {
  return useQuery({
    queryKey: ['devices', 'batch', batchId],
    queryFn: async () => {
      const api = await getDevicesApi()
      return api.getByBatchId(batchId)
    },
    enabled: !!batchId,
    staleTime: 0, // Always consider data stale - refetch on every mount
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
  })
}

export function useDevicesForFinalQC() {
  return useQuery({
    queryKey: ['devices', 'final-qc'],
    queryFn: async () => {
      const api = await getDevicesApi()
      return api.getDevicesForFinalQC()
    },
    staleTime: 0, // Always consider data stale - refetch on every mount
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
  })
}

export function useQCChecks(deviceIds?: string[], options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true
  
  // Only enable query if we have device IDs and they're not empty
  const shouldEnable = enabled && !!deviceIds && deviceIds.length > 0
  
  return useQuery({
    queryKey: ['qc-checks', deviceIds],
    queryFn: async () => {
      const api = await getDevicesApi()
      return api.getQCChecks(deviceIds)
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

  return useMutation({
    mutationFn: async (deviceData: DeviceFormData) => {
      const api = await getDevicesApi()
      return api.create(deviceData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
    },
  })
}

export function useCreateDevicesFromImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ batchId, devices }: { batchId: string; devices: DeviceFormData[] }) => {
      const api = await getDevicesApi()
      return api.createFromImport(batchId, devices)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
    },
  })
}

export function useUpdateDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Device> }) => {
      const api = await getDevicesApi()
      return api.update(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', id] })
      queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
    },
  })
}

export function useUpdateDeviceStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DeviceStatus }) => {
      const api = await getDevicesApi()
      return api.updateStatus(id, status)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', id] })
      queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
    },
  })
}

export function useUpdateDeviceGrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, grade }: { id: string; grade: DeviceGrade }) => {
      const api = await getDevicesApi()
      return api.updateGrade(id, grade)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', id] })
      queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
    },
  })
}

export function useDeleteDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const api = await getDevicesApi()
      return api.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useDeviceStatusHistory(deviceId: string) {
  return useQuery({
    queryKey: ['device-status-history', deviceId],
    queryFn: async () => {
      const api = await getDevicesApi()
      return api.getDeviceStatusHistory(deviceId)
    },
    enabled: !!deviceId,
    staleTime: 0, // Always consider data stale - refetch on every mount
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
  })
}


