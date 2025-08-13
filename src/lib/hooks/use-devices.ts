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

export function useCreateDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: devicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
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


