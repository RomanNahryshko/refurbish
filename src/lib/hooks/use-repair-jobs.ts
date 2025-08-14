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

export function useCompleteRepairJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      repairJobId, 
      completionNotes, 
      partsUsed 
    }: { 
      repairJobId: string
      completionNotes?: string
      partsUsed?: Array<{
        spare_part_id: string
        quantity_used: number
        notes?: string
      }>
    }) => {
      const response = await fetch('/api/repair-jobs/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repair_job_id: repairJobId,
          completion_notes: completionNotes,
          parts_used: partsUsed
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete repair job')
      }

      return response.json()
    },
    onSuccess: (data, { repairJobId }) => {
      // Invalidate repair jobs queries
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['repair-jobs', repairJobId] })
      
      // If device was sent to QC, also invalidate devices queries
      if (data.device_sent_to_qc) {
        queryClient.invalidateQueries({ queryKey: ['devices'] })
      }
    },
  })
}

export function useStartRepairJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      repairJobId, 
      assignedTo 
    }: { 
      repairJobId: string
      assignedTo?: string
    }) => {
      const updateData: any = {
        status: 'pending'
      }
      
      if (assignedTo) {
        updateData.status = 'in_progress'
        updateData.assigned_to = assignedTo
        updateData.assigned_at = new Date().toISOString()
      } else {
        updateData.assigned_to = null
        updateData.assigned_at = null
      }

      const response = await fetch(`/api/repair-jobs/${repairJobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update repair job')
      }

      return response.json()
    },
    onSuccess: (_, { repairJobId }) => {
      // Invalidate repair jobs queries
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['repair-jobs', repairJobId] })
    },
  })
}
