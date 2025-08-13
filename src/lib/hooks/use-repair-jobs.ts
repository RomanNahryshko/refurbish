import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repairJobsApi } from '@/lib/api/repair-jobs'
import { RepairJob, RepairJobData, PartsData } from '@/lib/types/business-types'

export function useRepairJobs() {
  return useQuery({
    queryKey: ['repair-jobs'],
    queryFn: repairJobsApi.getAll,
  })
}

export function useRepairJob(id: string) {
  return useQuery({
    queryKey: ['repair-jobs', id],
    queryFn: () => repairJobsApi.getById(id),
    enabled: !!id,
  })
}

export function useRepairJobsByDevice(deviceId: string) {
  return useQuery({
    queryKey: ['repair-jobs', 'device', deviceId],
    queryFn: () => repairJobsApi.getByDeviceId(deviceId),
    enabled: !!deviceId,
  })
}

export function useRepairJobsByTechnician(technicianId: string) {
  return useQuery({
    queryKey: ['repair-jobs', 'technician', technicianId],
    queryFn: () => repairJobsApi.getByTechnician(technicianId),
    enabled: !!technicianId,
  })
}

export function useCreateRepairJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, createdBy }: { data: RepairJobData; createdBy: string }) =>
      repairJobsApi.create(data, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
    },
  })
}

export function useUpdateRepairJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RepairJob> }) =>
      repairJobsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['repair-jobs', id] })
    },
  })
}

export function useDeleteRepairJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: repairJobsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
    },
  })
}

export function useRepairJobParts(repairJobId: string) {
  return useQuery({
    queryKey: ['repair-jobs', repairJobId, 'parts'],
    queryFn: () => repairJobsApi.getPartsUsed(repairJobId),
    enabled: !!repairJobId,
  })
}

export function useRecordPartsUsage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ partsData, recordedBy }: { partsData: PartsData[]; recordedBy: string }) =>
      repairJobsApi.recordPartsUsage(partsData, recordedBy),
    onSuccess: (_, { partsData }) => {
      // Invalidate parts queries for the repair job
      partsData.forEach(part => {
        queryClient.invalidateQueries({ queryKey: ['repair-jobs', part.repair_job_id, 'parts'] })
      })
    },
  })
}
