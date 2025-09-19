import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createRepairJobsAPI } from '@/lib/api/repair-jobs'
import { RepairJob, RepairJobData, PartsData } from '@/lib/types/business-types'
import { useSupabaseClient, useSupabaseIsReady } from '@/lib/stores/supabase-store'

export function useRepairJobs() {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  return useQuery({
    queryKey: ['repair-jobs'],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const repairJobsApi = createRepairJobsAPI(client)
      const result = await repairJobsApi.getAll()
      return result
    },
    enabled: isReady && !!client
  })
}

export function useRepairJob(id: string) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
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
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
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
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
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
  const client = useSupabaseClient()

  return useMutation({
    mutationFn: async ({ data }: { data: RepairJobData }) => {
      if (!client) throw new Error('Supabase client not available')
      const repairJobsApi = createRepairJobsAPI(client)
      return repairJobsApi.create(data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
      // Also invalidate devices queries since device status might change
      await queryClient.invalidateQueries({ queryKey: ['devices'] })
      await queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
    },
  })
}

export function useUpdateRepairJob() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RepairJob> }) => {
      if (!client) throw new Error('Supabase client not available')
      const repairJobsApi = createRepairJobsAPI(client)
      return repairJobsApi.update(id, data)
    },
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
      await queryClient.invalidateQueries({ queryKey: ['repair-jobs', id] })
      // Also invalidate devices queries since device status might change
      await queryClient.invalidateQueries({ queryKey: ['devices'] })
      await queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
    },
  })
}

export function useDeleteRepairJob() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Supabase client not available')
      const repairJobsApi = createRepairJobsAPI(client)
      return repairJobsApi.delete(id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
      // Also invalidate devices queries since device status might change
      await queryClient.invalidateQueries({ queryKey: ['devices'] })
      await queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
    },
  })
}

export function useRepairJobParts(repairJobId: string) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: ['repair-jobs', repairJobId, 'parts'],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const repairJobsApi = createRepairJobsAPI(client)
      return repairJobsApi.getSparePartsUsed(repairJobId)
    },
    enabled: isReady && !!client && !!repairJobId,
  })
}

export function useRecordPartsUsage() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()

  return useMutation({
    mutationFn: async ({ partsData }: { partsData: PartsData[] }) => {
      if (!client) throw new Error('Supabase client not available')
      const repairJobsApi = createRepairJobsAPI(client)
      return repairJobsApi.addSparePartsUsed(partsData)
    },
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
  const client = useSupabaseClient()

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
      
      console.log('🔧 [CLIENT] Starting repair job completion:', {
        repairJobId,
        hasCompletionNotes: !!completionNotes,
        partsCount: partsUsed?.length || 0
      })
      
      // Use the server API endpoint instead of client API to ensure proper logic
      const response = await fetch('/api/repair-jobs/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repair_job_id: repairJobId,
          completion_notes: completionNotes,
          parts_used: partsUsed?.map(part => ({
            spare_part_id: part.spare_part_id,
            quantity_used: part.quantity_used,
            notes: part.notes
          }))
        })
      })

      console.log('📡 [CLIENT] API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ [CLIENT] API error response:', errorData)
        throw new Error(errorData.error || 'Failed to complete repair job')
      }

      const result = await response.json()
      console.log('✅ [CLIENT] API success response:', {
        device_sent_to_qc: result.device_sent_to_qc,
        message: result.message
      })
      
      return result.data
    },
    onSuccess: async (data, { repairJobId, partsUsed }) => {
      console.log('🎉 [CLIENT] Repair job completion successful, invalidating queries')
      
      // Invalidate repair jobs queries
      await queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
      await queryClient.invalidateQueries({ queryKey: ['repair-jobs', repairJobId] })
      console.log('✅ [CLIENT] Repair jobs queries invalidated')
      
      // Also invalidate devices queries since device status changes to final_qc
      await queryClient.invalidateQueries({ queryKey: ['devices'] })
      await queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
      console.log('✅ [CLIENT] Devices queries invalidated')
      
      // Also invalidate QC checks queries since a new QC check is created
      await queryClient.invalidateQueries({ queryKey: ['qc-checks'] })
      console.log('✅ [CLIENT] QC checks queries invalidated')
      
      // Invalidate inventory queries if parts were used (stock levels changed)
      if (partsUsed && partsUsed.length > 0) {
        console.log('🔧 [CLIENT] Invalidating inventory queries due to parts usage')
        // Invalidate all spare parts queries (used by repair jobs page)
        await queryClient.invalidateQueries({ queryKey: ['spare-parts'] })
        
        // Invalidate inventory module queries (used by inventory page)
        await queryClient.invalidateQueries({ queryKey: ['parts'] })
        await queryClient.invalidateQueries({ queryKey: ['parts', 'low-stock'] })
        
        // Invalidate general inventory queries if they exist
        queryClient.invalidateQueries({ queryKey: ['inventory'] })
        
        // Invalidate specific parts that were used
        partsUsed.forEach(part => {
          queryClient.invalidateQueries({ queryKey: ['parts', part.spare_part_id] })
        })
        console.log('✅ [CLIENT] Inventory queries invalidated')
      }
      
      console.log('🏁 [CLIENT] All queries invalidated successfully')
    },
    onError: (error, { repairJobId }) => {
      console.error('❌ [CLIENT] Repair job completion failed:', { error, repairJobId })
      // Error handled by toast
    }
  })
}

export function useStartRepairJob() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()

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
    onSuccess: async (data, { repairJobId }) => {
      // Invalidate repair jobs queries
      await queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
      await queryClient.invalidateQueries({ queryKey: ['repair-jobs', repairJobId] })
      
      // Also invalidate devices queries since device status changes
      await queryClient.invalidateQueries({ queryKey: ['devices'] })
      
      // Force refetch devices to see the status change immediately
      await queryClient.refetchQueries({ queryKey: ['devices'] })
      await queryClient.refetchQueries({ queryKey: ['devices', 'final-qc'] })
    },
  })
}
