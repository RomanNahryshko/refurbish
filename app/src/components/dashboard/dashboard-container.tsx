'use client';

import React from 'react';
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
  const { data: realData, isPending: loading, isFetching } = useDashboardMetrics(selectedDateRange);

  // Show loading state
  if (loading || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
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
