import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Device, DeviceStatus, DeviceGrade } from '@/lib/types/business-types'
import { useSupabaseClient, useSupabaseIsReady } from '@/lib/stores/supabase-store'
import { CreateDeviceData, createDevicesAPI } from '@/lib/api/devices'

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()

  const fetchDevices = useCallback(async () => {
    if (!client || !isReady) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await client
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      setDevices(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices')
    } finally {
      setLoading(false)
    }
  }, [client, isReady])

  const createDevice = useCallback(async (device: Omit<Device, 'id' | 'created_at' | 'updated_at'>) => {
    if (!client || !isReady) return null
    
    try {
      const { data, error: createError } = await client
        .from('devices')
        .insert(device)
        .select()
        .single()
      
      if (createError) throw createError
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create device')
      return null
    }
  }, [client, isReady])

  const updateDevice = useCallback(async (id: string, updates: Partial<Device>) => {
    if (!client) return null
    
    try {
      const { data, error: updateError } = await client
        .from('devices')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (updateError) throw updateError
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device')
      return null
    }
  }, [client])

  const deleteDevice = useCallback(async (id: string) => {
    if (!client) return false
    
    try {
      const { error: deleteError } = await client
        .from('devices')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete device')
      return false
    }
  }, [client])

  const getDeviceById = useCallback(async (id: string) => {
    if (!client) return null
    
    try {
      const { data, error: fetchError } = await client
        .from('devices')
        .select('*')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch device')
      return null
    }
  }, [client])

  const getDevicesByBatch = useCallback(async (batchId: string) => {
    if (!client || !isReady) return []
    
    try {
      const { data, error: fetchError } = await client
        .from('devices')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch batch devices')
      return []
    }
  }, [client, isReady])

  const getDevicesByStatus = useCallback(async (status: string) => {
    if (!client || !isReady) return []
    
    try {
      const { data, error: fetchError } = await client
        .from('devices')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices by status')
      return []
    }
  }, [client, isReady])

  const getDevicesByType = useCallback(async (type: string) => {
    if (!client || !isReady) return []
    
    try {
      const { data, error: fetchError } = await client
        .from('devices')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices by type')
      return []
    }
  }, [client, isReady])

  const getDevicesByBrand = useCallback(async (brand: string) => {
    if (!client || !isReady) return []
    
    try {
      const { data, error: fetchError } = await client
        .from('devices')
        .select('*')
        .eq('brand', brand)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices by brand')
      return []
    }
  }, [client, isReady])

  const getDevicesByModel = useCallback(async (model: string) => {
    if (!client || !isReady) return []
    
    try {
      const { data, error: fetchError } = await client
        .from('devices')
        .select('*')
        .eq('model', model)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices by model')
      return []
    }
  }, [client, isReady])

  const getDevicesByGrade = useCallback(async (grade: string) => {
    if (!client || !isReady) return []
    
    try {
      const { data, error: fetchError } = await client
        .from('devices')
        .select('*')
        .eq('grade', grade)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices by grade')
      return []
    }
  }, [client, isReady])

  const getDevicesByDateRange = useCallback(async (startDate: string, endDate: string) => {
    if (!client || !isReady) return []
    
    try {
      const { data, error: fetchError } = await client
        .from('devices')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices by date range')
      return []
    }
  }, [client, isReady])

  const searchDevices = useCallback(async (query: string) => {
    if (!client) return []
    
    try {
      const { data, error: fetchError } = await client
        .from('devices')
        .select('*')
        .or(`brand.ilike.%${query}%,model.ilike.%${query}%,serial_number.ilike.%${query}%`)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search devices')
      return []
    }
  }, [client])

  return {
    devices,
    loading,
    error,
    fetchDevices,
    createDevice,
    updateDevice,
    deleteDevice,
    getDeviceById,
    getDevicesByBatch,
    getDevicesByStatus,
    getDevicesByType,
    getDevicesByBrand,
    getDevicesByModel,
    getDevicesByGrade,
    getDevicesByDateRange,
    searchDevices,
  }
}

export function useDevice(id: string) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: ['devices', id],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getById(id)
    },
    enabled: isReady && !!client && !!id,
  })
}

export function useDeviceByInternalId(internalId: string) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: ['devices', 'internal', internalId],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getByInternalId(internalId)
    },
    enabled: isReady && !!client && !!internalId,
  })
}

export function useDevicesByBatch(batchId: string) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: ['devices', 'batch', batchId],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getByBatchId(batchId)
    },
    enabled: isReady && !!client && !!batchId,
    staleTime: 0, // Always consider data stale - refetch on every mount
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
  })
}

export function useDevicesForFinalQC() {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  return useQuery({
    queryKey: ['devices', 'final-qc'],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getDevicesForFinalQC()
    },
    enabled: isReady && !!client,
    staleTime: 0, // Always consider data stale - refetch on every mount
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
  })
}

export function useQCChecks(deviceIds?: string[], options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  // Only enable query if we have device IDs and they're not empty
  const shouldEnable = enabled && !!deviceIds && deviceIds.length > 0 && isReady && !!client
  
  return useQuery({
    queryKey: ['qc-checks', deviceIds],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getQCChecks(deviceIds || [])
    },
    enabled: shouldEnable,
    staleTime: 5 * 60 * 1000, // 5 minutes - QC checks don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    refetchOnMount: false,
    retry: 2,
  })
}

export function useCreateDevice() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()
  
  return useMutation({
    mutationFn: async (deviceData: CreateDeviceData) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.create(deviceData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useUpdateDevice() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Device> }) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.update(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', id] })
    },
  })
}

export function useDeleteDevice() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useUpdateDeviceStatus() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()
  
  return useMutation({
    mutationFn: async ({ id, status, grade }: { id: string; status: DeviceStatus; grade?: DeviceGrade }) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.updateStatus(id, status, grade)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['devices', id] })
    },
  })
}

export function useBulkCreateDevices() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()
  
  return useMutation({
    mutationFn: async (devicesData: CreateDeviceData[]) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.bulkCreate(devicesData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useBulkUpdateDevices() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()
  
  return useMutation({
    mutationFn: async (updates: { id: string; data: Partial<Device> }[]) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.bulkUpdate(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useDeviceCountByStatus(status: DeviceStatus) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: ['devices', 'count', 'status', status],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getCountByStatus(status)
    },
    enabled: isReady && !!client,
    staleTime: 2 * 60 * 1000, // 2 minutes - counts change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
  })
}

export function useDeviceCountByBatch(batchId: string) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: ['devices', 'count', 'batch', batchId],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getCountByBatch(batchId)
    },
    enabled: isReady && !!client && !!batchId,
    staleTime: 2 * 60 * 1000, // 2 minutes - counts change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
  })
}

export function useDeviceStatusHistory(deviceId: string) {
  const client = useSupabaseClient()
  const isReady = useSupabaseIsReady()
  
  return useQuery({
    queryKey: ['device-status-history', deviceId],
    queryFn: async () => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.getDeviceStatusHistory(deviceId)
    },
    enabled: isReady && !!client && !!deviceId,
    staleTime: 0, // Always consider data stale - refetch on every mount
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
  })
}

export function useCreateDevicesFromImport() {
  const queryClient = useQueryClient()
  const client = useSupabaseClient()
  
  return useMutation({
    mutationFn: async (devicesData: CreateDeviceData[]) => {
      if (!client) throw new Error('Supabase client not available')
      const devicesApi = createDevicesAPI(client)
      return devicesApi.bulkCreate(devicesData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })
}


