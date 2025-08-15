import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { devicesApi } from '@/lib/api/devices'
import { Device, DeviceStatus, DeviceGrade, DeviceFormData } from '@/lib/types/business-types'

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: devicesApi.getAll,
  })
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ['devices', id],
    queryFn: () => devicesApi.getById(id),
    enabled: !!id,
  })
}

export function useDeviceByInternalId(internalId: string) {
  return useQuery({
    queryKey: ['devices', 'internal', internalId],
    queryFn: () => devicesApi.getByInternalId(internalId),
    enabled: !!internalId,
  })
}

export function useDevicesByBatch(batchId: string) {
  return useQuery({
    queryKey: ['devices', 'batch', batchId],
    queryFn: () => devicesApi.getByBatchId(batchId),
    enabled: !!batchId,
  })
}

export function useDevicesForFinalQC() {
  return useQuery({
    queryKey: ['devices', 'final-qc'],
    queryFn: devicesApi.getDevicesForFinalQC,
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
    queryFn: () => devicesApi.getQCChecks(deviceIds),
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
    mutationFn: devicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
    },
  })
}

export function useCreateDevicesFromImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ batchId, devices }: { batchId: string; devices: DeviceFormData[] }) =>
      devicesApi.createFromImport(batchId, devices),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
    },
  })
}

export function useUpdateDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Device> }) =>
      devicesApi.update(id, data),
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
    mutationFn: ({ id, status }: { id: string; status: DeviceStatus }) =>
      devicesApi.updateStatus(id, status),
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
    mutationFn: ({ id, grade }: { id: string; grade: DeviceGrade }) =>
      devicesApi.updateGrade(id, grade),
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
    mutationFn: devicesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}


