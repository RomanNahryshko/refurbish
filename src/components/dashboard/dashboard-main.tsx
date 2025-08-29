'use client';

import { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import DashboardContainer from './dashboard-container';
import { DateRangePicker } from './date-range-picker';

const DashboardMain = () => {
  
  // Initialize with today's date as both start and end
  // Use dayjs for reliable date handling
  const today = useMemo(() => {
    return dayjs().startOf('day').toDate();
  }, []); // Empty dependency array means it will recalculate on every render
  
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>({
    from: today,
    to: today
  });

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
