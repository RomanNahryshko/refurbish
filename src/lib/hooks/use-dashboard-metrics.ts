import { useState, useEffect } from 'react';
import { DashboardService, DashboardMetrics } from '@/lib/services/dashboard-service';
import { createSupabaseClient } from '@/lib/supabase/client';
import { DateRange } from 'react-day-picker';

interface UseDashboardMetricsReturn {
  data: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardMetrics(dateRange?: DateRange): UseDashboardMetricsReturn {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createSupabaseClient();
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }

      const dashboardService = new DashboardService(supabase);
      
      // Convert DateRange to the format expected by the service
      let serviceDateRange: { from: Date; to: Date } | undefined;
      if (dateRange?.from && dateRange?.to) {
        serviceDateRange = {
          from: dateRange.from,
          to: dateRange.to
        };
      }
      
      const metrics = await dashboardService.getDashboardMetrics(serviceDateRange);
      console.log('Metrics:', metrics);
      
      setData(metrics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard metrics';
      setError(errorMessage);
      console.error('Dashboard metrics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [dateRange?.from, dateRange?.to]);

  const refetch = async () => {
    await fetchMetrics();
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
}
