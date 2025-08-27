'use client';

import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import RoleSelector, { UserRole } from './role-selector';
import DashboardContainer from './dashboard-container';
import { DateRangePicker } from './date-range-picker';

const DashboardMain = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  
  // Initialize with today's date as both start and end
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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
          <RoleSelector selectedRole={selectedRole} onRoleChange={setSelectedRole} />
        </div>
        
        <DateRangePicker 
          selectedRange={selectedDateRange} 
          onRangeChange={setSelectedDateRange} 
        />
      </div>

      {/* Dashboard Content */}
      <DashboardContainer 
        selectedRole={selectedRole} 
        selectedDateRange={selectedDateRange} 
        onDateRangeChange={setSelectedDateRange} 
      />
    </div>
  );
};

export default DashboardMain;
