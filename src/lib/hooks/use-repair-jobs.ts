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
      // Also invalidate devices queries since device status might change
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
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
      // Also invalidate devices queries since device status might change
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
    },
  })
}

export function useDeleteRepairJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: repairJobsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
      // Also invalidate devices queries since device status might change
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
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
      
      // Invalidate inventory queries since stock levels changed by parts usage
      if (partsData && partsData.length > 0) {
        // Invalidate all spare parts queries (used by repair jobs page)
        queryClient.invalidateQueries({ queryKey: ['spare-parts'] })
        
        // Invalidate inventory module queries (used by inventory page)
        queryClient.invalidateQueries({ queryKey: ['parts'] })
        queryClient.invalidateQueries({ queryKey: ['parts', 'low-stock'] })
        
        // Invalidate specific parts that were used
        partsData.forEach(part => {
          queryClient.invalidateQueries({ queryKey: ['parts', part.spare_part_id] })
        })
      }
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
      
      // Transform parts data to include repair_job_id
      const transformedParts = partsUsed?.map(part => ({
        ...part,
        repair_job_id: repairJobId
      }))
      
      const result = await repairJobsApi.completeRepairJob(repairJobId, {
        completion_notes: completionNotes,
        parts_used: transformedParts
      })
      
      return result
    },
    onSuccess: (data, { repairJobId, partsUsed }) => {
      // Invalidate repair jobs queries
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['repair-jobs', repairJobId] })
      
      // Also invalidate devices queries since device status changes to final_qc
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
      
      // Also invalidate QC checks queries since a new QC check is created
      queryClient.invalidateQueries({ queryKey: ['qc-checks'] })
      
      // Invalidate inventory queries if parts were used (stock levels changed)
      if (partsUsed && partsUsed.length > 0) {
        // Invalidate all spare parts queries (used by repair jobs page)
        queryClient.invalidateQueries({ queryKey: ['spare-parts'] })
        
        // Invalidate inventory module queries (used by inventory page)
        queryClient.invalidateQueries({ queryKey: ['parts'] })
        queryClient.invalidateQueries({ queryKey: ['parts', 'low-stock'] })
        
        // Invalidate general inventory queries if they exist
        queryClient.invalidateQueries({ queryKey: ['inventory'] })
        
        // Invalidate specific parts that were used
        partsUsed.forEach(part => {
          queryClient.invalidateQueries({ queryKey: ['parts', part.spare_part_id] })
        })
      }
      
    },
    onError: (error, { repairJobId }) => {
      console.error('Failed to complete repair job:', repairJobId, error)
    }
  })
}

export function useStartRepairJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      repairJobId, 
      assignedTo 
    }: { 
      repairJobId: string
      assignedTo?: string
    }) => {
      console.log('🔧 useStartRepairJob mutationFn called with:', { repairJobId, assignedTo })
      return repairJobsApi.startRepairJob(repairJobId, assignedTo)
    },
    onSuccess: (data, { repairJobId }) => {
      console.log('🔧 useStartRepairJob success:', data)
      // Invalidate repair jobs queries
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['repair-jobs', repairJobId] })
      
      // Also invalidate devices queries since device status changes
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      
      // Force refetch devices to see the status change immediately
      queryClient.refetchQueries({ queryKey: ['devices'] })
      queryClient.refetchQueries({ queryKey: ['devices', 'final-qc'] })
    },
    onError: (error, { repairJobId }) => {
      console.error('🔧 useStartRepairJob error:', error)
      console.error('Failed to start repair job:', repairJobId, error)
    }
  })
}
