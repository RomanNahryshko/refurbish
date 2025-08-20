'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { createSupabaseClient } from '@/lib/supabase/client'

interface DrPhoneData {
  imei: string
  model: string
  brand: string
  serialNumber: string
  faults: string
}

interface ExistingDevice {
  id: string
  imei: string
  brand: string
  model: string
  serial_number: string
}

interface QCCheck {
  id: string
  overall_result: string
}

// Hook to check for existing devices by IMEIs
export function useExistingDevices() {
  return useQuery<ExistingDevice[]>({
    queryKey: ['devices', 'existing'],
    queryFn: async () => {
      const supabase = createSupabaseClient()
      if (!supabase) throw new Error('Supabase client not initialized')

      const { data, error } = await supabase
        .from('devices')
        .select('id, imei, brand, model, serial_number')
        .is('deleted_at', null)

      if (error) throw error
      return data || []
    },
    staleTime: 30000, // 30 seconds
  })
}

// Hook to check completed QC for specific device IDs
export function useCompletedQCChecks(deviceIds: string[]) {
  return useQuery<Record<string, QCCheck[]>>({
    queryKey: ['qc-checks', 'completed', deviceIds],
    queryFn: async () => {
      if (deviceIds.length === 0) return {}

      const supabase = createSupabaseClient()
      if (!supabase) throw new Error('Supabase client not initialized')

      const { data, error } = await supabase
        .from('qc_checks')
        .select('id, device_id, overall_result')
        .in('device_id', deviceIds)
        .eq('check_type', 'initial')
        .in('overall_result', ['pass', 'fail'])

      if (error) throw error
  
      // Group by device_id
      const grouped = (data || []).reduce((acc: Record<string, QCCheck[]>, qc: any) => {
        if (!acc[qc.device_id]) {
          acc[qc.device_id] = []
        }
        acc[qc.device_id].push(qc)
        return acc
      }, {} as Record<string, QCCheck[]>)

      return grouped
    },
    enabled: deviceIds.length > 0,
    staleTime: 10000, // 10 seconds
  })
}

// Hook to get device by IMEI and batch
export function useDeviceByImeiAndBatch(imei: string, batchId: string) {
  return useQuery<ExistingDevice | null>({
    queryKey: ['devices', 'by-imei-batch', imei, batchId],
    queryFn: async () => {
      if (!imei || !batchId) return null

      const supabase = createSupabaseClient()
      if (!supabase) throw new Error('Supabase client not initialized')

      const { data, error } = await supabase
        .from('devices')
        .select('id, imei, brand, model, serial_number')
        .eq('imei', imei)
        .eq('batch_id', batchId)
        .is('deleted_at', null)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw error
      }

      return data
    },
    enabled: Boolean(imei && batchId),
    staleTime: 30000,
  })
}

// Custom hook for filtering devices by existing ones
export function useFilterDevicesByExisting(devices: DrPhoneData[]) {
  const { data: existingDevices, isLoading, error } = useExistingDevices()

  const filteredDevices = React.useMemo(() => {
    if (!existingDevices || devices.length === 0) return devices

    const existingIMEIs = new Set(
      existingDevices.map((d) => d.imei?.toString()?.trim()).filter(Boolean)
    )

    const cleanedDevices = devices.map((device) => ({
      ...device,
      imei: device.imei?.toString()?.trim() || '',
    }))

    return cleanedDevices.filter((device) => !existingIMEIs.has(device.imei))
  }, [devices, existingDevices])

  const existingCount = devices.length - filteredDevices.length

  return {
    filteredDevices,
    existingCount,
    isLoading,
    error,
  }
}

// Custom hook for checking completed QC by IMEIs
export function useCompletedQCByDevices(devices: DrPhoneData[], createdDevices: Array<{ id: string; imei: string }>) {
  // Get device IDs that we need to check
  const deviceIds = React.useMemo(() => {
    return devices
      .map((device) => {
        const createdDevice = createdDevices.find((d) => d.imei === device.imei)
        return createdDevice?.id
      })
      .filter(Boolean) as string[]
  }, [devices, createdDevices])

  const { data: completedQC, isLoading, error } = useCompletedQCChecks(deviceIds)

  const completedIMEIs = React.useMemo(() => {
    if (!completedQC) return new Set<string>()

    const completedSet = new Set<string>()
    
    devices.forEach((device) => {
      const createdDevice = createdDevices.find((d) => d.imei === device.imei)
      if (createdDevice?.id && completedQC[createdDevice.id]?.length > 0) {
        completedSet.add(device.imei)
      }
    })

    return completedSet
  }, [devices, createdDevices, completedQC])

  return {
    completedIMEIs,
    isLoading,
    error,
  }
}

import React from 'react'

// Removed: Complex device creation hook - keeping logic in component for now

// Hook to find existing device by IMEI and batch (used for error handling)
export function useFindExistingDevice() {
  return useMutation<ExistingDevice | null, Error, { imei: string; batchId: string }>({
    mutationFn: async ({ imei, batchId }) => {
      const supabase = createSupabaseClient()
      if (!supabase) throw new Error('Supabase client not initialized')

      const { data, error } = await supabase
        .from('devices')
        .select('id, imei, brand, model, serial_number')
        .eq('imei', imei)
        .eq('batch_id', batchId)
        .is('deleted_at', null)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw error
      }

      return data
    },
  })
}
