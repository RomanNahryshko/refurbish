'use client';

import { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import DashboardContainer from './dashboard-container';
import { DateRangePicker } from './date-range-picker';

const DashboardMain = () => {
  
  // Initialize with today's date as both start and end
  // Use native Date to avoid timezone issues
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []); // Calculated once on mount
  
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>({
    from: today,
    to: today
  });

  // Note: React Query automatically handles refetching when dateRange changes
  // so we don't need manual refetch logic here

  return (
    <div className="space-y-6">
      {/* Header with title and role selector on left, date picker on right */}
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Operational Metrics & Analytics
            </p>
          </div>
        </div>
        
        <DateRangePicker 
          selectedRange={selectedDateRange} 
          onRangeChange={setSelectedDateRange}
        />
      </div>

      {/* Dashboard Content */}
      <DashboardContainer 
        selectedDateRange={selectedDateRange} 
        onDateRangeChange={setSelectedDateRange}
      />
    </div>
  );
};

export default DashboardMain;
