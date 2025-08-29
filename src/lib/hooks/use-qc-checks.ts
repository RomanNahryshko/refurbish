import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createQCChecksAPI } from '@/lib/api/qc-checks'
import { DeviceGrade, QCCheck, QCCheckFormData, TestResultData } from '@/lib/types/business-types'
import { useSupabaseClient, useSupabaseIsReady } from '@/lib/stores/supabase-store'

export function useQCChecksByDevice(deviceId: string) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: ['qc-checks', 'device', deviceId],
    queryFn: async () => {
      if (!client || !isReady) throw new Error('Supabase client not available')
      const qcChecksApi = createQCChecksAPI(client)
      return qcChecksApi.getByDeviceId(deviceId)
    },
    enabled: isReady && !!client && !!deviceId,
  })
}

export function useQCCheck(id: string) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: ['qc-checks', id],
    queryFn: async () => {
      if (!client || !isReady) throw new Error('Supabase client not available')
      const qcChecksApi = createQCChecksAPI(client)
      return qcChecksApi.getById(id)
    },
    enabled: isReady && !!client && !!id,
  })
}

export function useCreateQCCheck() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()
  
  return useMutation({
    mutationFn: async ({ qcData, testResults }: { qcData: QCCheckFormData; testResults?: TestResultData[] }) => {
      if (!client) throw new Error('Supabase client not available')
      const qcChecksApi = createQCChecksAPI(client)
      return qcChecksApi.create(qcData, testResults)
    },
    onSuccess: (_, { qcData }) => {
      queryClient.invalidateQueries({ queryKey: ['qc-checks', 'device', qcData.device_id] })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', 'final-qc'] })
    },
  })
}

export function useUpdateQCCheck() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()
  
  return useMutation({
    mutationFn: async ({ id, qcData }: { id: string; qcData: Partial<QCCheck> }) => {
      if (!client) throw new Error('Supabase client not available')
      const qcChecksApi = createQCChecksAPI(client)
      return qcChecksApi.update(id, qcData)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['qc-checks', id] })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useDeleteQCCheck() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Supabase client not available')
      const qcChecksApi = createQCChecksAPI(client)
      return qcChecksApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-checks'] })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useQCChecksByType(checkType: 'initial' | 'final') {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: ['qc-checks', 'type', checkType],
    queryFn: async () => {
      if (!client || !isReady) throw new Error('Supabase client not available')
      const qcChecksApi = createQCChecksAPI(client)
      return qcChecksApi.getByType(checkType)
    },
    enabled: isReady && !!client,
  })
}

export function useQCChecksByResult(result: 'not_tested' | 'pass' | 'fail') {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: ['qc-checks', 'result', result],
    queryFn: async () => {
      if (!client || !isReady) throw new Error('Supabase client not available')
      const qcChecksApi = createQCChecksAPI(client)
      return qcChecksApi.getByResult(result)
    },
    enabled: isReady && !!client,
  })
}

export function useQCChecksByGrade(grade: string) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: ['qc-checks', 'grade', grade],
    queryFn: async () => {
      if (!client || !isReady) throw new Error('Supabase client not available')
      const qcChecksApi = createQCChecksAPI(client)
      return qcChecksApi.getByGrade(grade as DeviceGrade) 
    },
    enabled: isReady && !!client,
  })
}

export function useQCChecksByDateRange(startDate: string, endDate: string) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: ['qc-checks', 'date-range', startDate, endDate],
    queryFn: async () => {
      if (!client || !isReady) throw new Error('Supabase client not available')
      const qcChecksApi = createQCChecksAPI(client)
      return qcChecksApi.getByDateRange(startDate, endDate)
    },
    enabled: isReady && !!client && !!startDate && !!endDate,
  })
}