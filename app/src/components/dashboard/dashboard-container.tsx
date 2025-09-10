'use client';

import React, { useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import AdminDashboard from './admin-dashboard';
import { useDashboardMetrics } from '@/lib/hooks/use-dashboard-metrics';

interface DashboardContainerProps {
  selectedDateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({ 
  selectedDateRange, 
  onDateRangeChange 
}) => {
  // Fetch real data from Supabase
  const { data: realData, loading, error, refetch } = useDashboardMetrics(selectedDateRange);

  // Refetch data every time the component mounts (page visit)
  useEffect(() => {
    refetch();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2 text-red-600">Error loading dashboard</h3>
          <p className="text-muted-foreground mb-4 text-sm">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={() => refetch()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 mr-2"
            >
              Retry
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Reload Page
            </button>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            <p>If the problem persists, check:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Internet connection</li>
              <li>Supabase service status</li>
              <li>Environment variables</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // If no data, show empty state
  if (!realData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-muted-foreground text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">No dashboard data available</h3>
          <p className="text-muted-foreground">The dashboard is empty or no data has been imported yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
     <AdminDashboard 
          realData={realData} 
          selectedDateRange={selectedDateRange} 
          onDateRangeChange={onDateRangeChange} 
        />
    </div>
  );
};

export default DashboardContainer;
