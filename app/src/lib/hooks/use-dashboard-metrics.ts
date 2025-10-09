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
      
      // Helper function to format date as YYYY-MM-DD
      const formatDateForAPI = (date: Date): string => {
        return date.getFullYear() + '-' + 
          String(date.getMonth() + 1).padStart(2, '0') + '-' + 
          String(date.getDate()).padStart(2, '0');
      };

      if (dateRange?.from) {
        params.append('from', formatDateForAPI(new Date(dateRange.from)))
      }
      if (dateRange?.to) {
        params.append('to', formatDateForAPI(new Date(dateRange.to)))
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
    staleTime: 0, // Always consider data stale to ensure fresh requests
    gcTime: 1 * 60 * 1000, // 1 minute in cache
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2,
    // Ensure loading states are properly handled
    notifyOnChangeProps: ['data', 'error', 'isPending', 'isFetching'],
  })
}