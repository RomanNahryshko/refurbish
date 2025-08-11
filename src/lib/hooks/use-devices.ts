import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { devicesApi, type CreateDeviceData } from '@/lib/api/devices'
import { toast } from 'sonner'

// Query keys for devices
export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  list: (filters: string) => [...deviceKeys.lists(), { filters }] as const,
  details: () => [...deviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceKeys.details(), id] as const,
  byBatch: (batchId: string) => [...deviceKeys.all, 'by-batch', batchId] as const,
}

// Hook to get all devices
export function useDevices() {
  return useQuery({
    queryKey: deviceKeys.lists(),
    queryFn: () => devicesApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get devices by batch ID
export function useDevicesByBatch(batchId: string) {
  return useQuery({
    queryKey: deviceKeys.byBatch(batchId),
    queryFn: () => devicesApi.getByBatchId(batchId),
    enabled: !!batchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get a single device by ID
export function useDevice(id: string) {
  return useQuery({
    queryKey: deviceKeys.detail(id),
    queryFn: () => devicesApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get a single device by internal ID
export function useDeviceByInternalId(internalId: string) {
  return useQuery({
    queryKey: [...deviceKeys.details(), 'internal', internalId],
    queryFn: () => devicesApi.getByInternalId(internalId),
    enabled: !!internalId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to create a new device
export function useCreateDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: devicesApi.create,
    onSuccess: (data) => {
      // Invalidate and refetch devices lists
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.byBatch(data.batch_id) })
      toast.success('Device created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create device: ${error.message}`)
    },
  })
}

// Hook to create multiple devices from import
export function useCreateDevicesFromImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ batchId, devices }: { batchId: string; devices: Array<{
      imei: string
      brand?: string
      model?: string
      serial_number?: string
      dr_phone_data?: any
    }> }) => devicesApi.createFromImport(batchId, devices),
    onSuccess: (data, { batchId }) => {
      // Invalidate and refetch devices lists
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.byBatch(batchId) })
    },
    onError: (error: Error) => {
      toast.error(`Failed to import devices: ${error.message}`)
    },
  })
}

// Hook to update a device
export function useUpdateDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDeviceData> }) =>
      devicesApi.update(id, data),
    onSuccess: (data) => {
      // Invalidate and refetch specific device and lists
      queryClient.invalidateQueries({ queryKey: deviceKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.byBatch(data.batch_id) })
      toast.success('Device updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update device: ${error.message}`)
    },
  })
}

// Hook to delete a device
export function useDeleteDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: devicesApi.delete,
    onSuccess: () => {
      // Invalidate and refetch devices lists
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      toast.success('Device deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete device: ${error.message}`)
    },
  })
}


