import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createRepairJobsAPI } from '@/lib/api/repair-jobs'
import { RepairJob, RepairJobData, PartsData } from '@/lib/types/business-types'
import { useSupabaseContext } from '@/lib/providers/supabase-provider'

export function useRepairJobs() {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['repair-jobs'],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const repairJobsApi = createRepairJobsAPI(client)
      return repairJobsApi.getAll()
    },
    enabled: isReady && !!client,
  })
}

export function useRepairJob(id: string) {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['repair-jobs', id],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const repairJobsApi = createRepairJobsAPI(client)
      return repairJobsApi.getById(id)
    },
    enabled: isReady && !!client && !!id,
  })
}

export function useRepairJobsByDevice(deviceId: string) {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['repair-jobs', 'device', deviceId],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const repairJobsApi = createRepairJobsAPI(client)
      return repairJobsApi.getByDeviceId(deviceId)
    },
    enabled: isReady && !!client && !!deviceId,
  })
}

export function useRepairJobsByTechnician(technicianId: string) {
  const { client, isReady } = useSupabaseContext()
  
  return useQuery({
    queryKey: ['repair-jobs', 'technician', technicianId],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const repairJobsApi = createRepairJobsAPI(client)
      return repairJobsApi.getByTechnician(technicianId)
    },
    enabled: isReady && !!client && !!technicianId,
  })
}

export function useCreateRepairJob() {
  const queryClient = useQueryClient()
  const { client } = useSupabaseContext()

  return useMutation({
    mutationFn: async ({ data, createdBy }: { data: RepairJobData; createdBy: string }) => {
      if (!client) throw new Error('Supabase client not available')
      const repairJobsApi = createRepairJobsAPI(client)
      return repairJobsApi.create(data, createdBy)
    },
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
  const { client } = useSupabaseContext()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RepairJob> }) => {
      if (!client) throw new Error('Supabase client not available')
      const repairJobsApi = createRepairJobsAPI(client)
      return repairJobsApi.update(id, data)
    },
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
    mutationFn: (id: string) => repairJobsApi.delete(id),
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
  const { client } = useSupabaseContext()

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
      if (!client) throw new Error('Supabase client not available')
      
      // Transform parts data to include repair_job_id
      const transformedParts = partsUsed?.map(part => ({
        ...part,
        repair_job_id: repairJobId
      }))
      
      const repairJobsApi = createRepairJobsAPI(client)
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
      console.error('useCompleteRepairJob onError', { error, repairJobId })
      // Error handled by toast
    }
  })
}

export function useStartRepairJob() {
  const queryClient = useQueryClient()
  const { client } = useSupabaseContext()

  return useMutation({
    mutationFn: ({ 
      repairJobId, 
      assignedTo 
    }: { 
      repairJobId: string
      assignedTo?: string
    }) => {
      if (!client) throw new Error('Supabase client not available')
      const repairJobsApi = createRepairJobsAPI(client)
      return repairJobsApi.startRepairJob(repairJobId, assignedTo)
    },
    onSuccess: (data, { repairJobId }) => {
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
      // Error handled by toast
    }
  })
}
