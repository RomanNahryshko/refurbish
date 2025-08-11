import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qcChecksApi, type CreateQCCheckData } from '@/lib/api/qc-checks'
import { toast } from 'sonner'

// Query keys for QC checks
export const qcCheckKeys = {
  all: ['qc-checks'] as const,
  lists: () => [...qcCheckKeys.all, 'list'] as const,
  list: (filters: string) => [...qcCheckKeys.lists(), { filters }] as const,
  details: () => [...qcCheckKeys.all, 'detail'] as const,
  detail: (id: string) => [...qcCheckKeys.details(), id] as const,
  byDevice: (deviceId: string) => [...qcCheckKeys.all, 'by-device', deviceId] as const,
}

// Hook to get QC checks for a device
export function useQCChecksByDevice(deviceId: string) {
  return useQuery({
    queryKey: qcCheckKeys.byDevice(deviceId),
    queryFn: () => qcChecksApi.getByDeviceId(deviceId),
    enabled: !!deviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get a single QC check by ID
export function useQCCheck(id: string) {
  return useQuery({
    queryKey: qcCheckKeys.detail(id),
    queryFn: () => qcChecksApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to create a new QC check
export function useCreateQCCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ qcData, repairTaskIds }: { qcData: CreateQCCheckData; repairTaskIds?: string[] }) =>
      qcChecksApi.create(qcData, repairTaskIds),
    onSuccess: (data) => {
      // Invalidate and refetch QC checks for the device
      queryClient.invalidateQueries({ queryKey: qcCheckKeys.byDevice(data.device_id) })
      queryClient.invalidateQueries({ queryKey: qcCheckKeys.lists() })
      toast.success('QC check completed successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to complete QC check: ${error.message}`)
    },
  })
}

// Hook to update a QC check
export function useUpdateQCCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      id, 
      qcData, 
      repairTaskIds 
    }: { 
      id: string; 
      qcData: Partial<CreateQCCheckData>; 
      repairTaskIds?: string[] 
    }) => qcChecksApi.update(id, qcData, repairTaskIds),
    onSuccess: (data) => {
      // Invalidate and refetch specific QC check and device QC checks
      queryClient.invalidateQueries({ queryKey: qcCheckKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: qcCheckKeys.byDevice(data.device_id) })
      queryClient.invalidateQueries({ queryKey: qcCheckKeys.lists() })
      toast.success('QC check updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update QC check: ${error.message}`)
    },
  })
}

// Hook to delete a QC check
export function useDeleteQCCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: qcChecksApi.delete,
    onSuccess: () => {
      // Invalidate and refetch QC checks lists
      queryClient.invalidateQueries({ queryKey: qcCheckKeys.lists() })
      toast.success('QC check deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete QC check: ${error.message}`)
    },
  })
}


