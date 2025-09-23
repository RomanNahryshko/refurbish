'use client'

import { useQuery } from '@tanstack/react-query'
import { DashboardMetrics } from '@/lib/services/dashboard-service'

interface DateRange {
  from?: Date
  to?: Date
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
  metricsWithRange: (dateRange?: DateRange) => [...dashboardKeys.metrics(), { dateRange }] as const,
}

/**
 * Hook to fetch dashboard metrics with optional date range
 */
export function useDashboardMetrics(dateRange?: DateRange) {
  return useQuery<DashboardMetrics>({
    queryKey: dashboardKeys.metricsWithRange(dateRange),
    queryFn: async () => {
      const params = new URLSearchParams()
      
      if (dateRange?.from) {
        params.append('from', dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        params.append('to', dateRange.to.toISOString())
      }
      
      const response = await fetch(`/api/dashboard/metrics?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch dashboard metrics')
      }
      
      const { data } = await response.json()
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: true,
    retry: 2,
  })
}