import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qcChecksApi } from '@/lib/api/qc-checks'
import { QCCheck, QCCheckFormData, TestResultData } from '@/lib/types/business-types'

export function useQCChecksByDevice(deviceId: string) {
  return useQuery({
    queryKey: ['qc-checks', 'device', deviceId],
    queryFn: () => qcChecksApi.getByDeviceId(deviceId),
    enabled: !!deviceId,
  })
}

export function useQCCheck(id: string) {
  return useQuery({
    queryKey: ['qc-checks', id],
    queryFn: () => qcChecksApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateQCCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ qcData, testResults }: { qcData: QCCheckFormData; testResults?: TestResultData[] }) =>
      qcChecksApi.create(qcData, testResults),
    onSuccess: (_, { qcData }) => {
      queryClient.invalidateQueries({ queryKey: ['qc-checks', 'device', qcData.device_id] })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useUpdateQCCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, qcData, testResults }: { id: string; qcData: Partial<QCCheck>; testResults?: TestResultData[] }) =>
      qcChecksApi.update(id, qcData, testResults),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['qc-checks', id] })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useDeleteQCCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: qcChecksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-checks'] })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useQCTestResults(qcCheckId: string) {
  return useQuery({
    queryKey: ['qc-test-results', qcCheckId],
    queryFn: () => qcChecksApi.getTestResults(qcCheckId),
    enabled: !!qcCheckId,
  })
}

export function useAddQCTestResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: qcChecksApi.addTestResult,
    onSuccess: (_, { qc_check_id }) => {
      queryClient.invalidateQueries({ queryKey: ['qc-test-results', qc_check_id] })
      queryClient.invalidateQueries({ queryKey: ['qc-checks'] })
    },
  })
}


