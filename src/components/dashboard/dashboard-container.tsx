'use client';

import React from 'react';
import { DateRange } from 'react-day-picker';
import AdminDashboard from './admin-dashboard';
import OpsManagerDashboard from './ops-manager-dashboard';
import QCDashboard from './qc-dashboard';
import TechnicianDashboard from './technician-dashboard';
import { UserRole } from './role-selector';
import { useDashboardMetrics } from '@/lib/hooks/use-dashboard-metrics';

interface DashboardContainerProps {
  selectedRole: UserRole;
  selectedDateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({ 
  selectedRole, 
  selectedDateRange, 
  onDateRangeChange 
}) => {
  // Fetch real data from Supabase
  const { data: realData, loading } = useDashboardMetrics(selectedDateRange);

  // Convert DateRange to string for components that expect it
  const selectedDate = selectedDateRange?.from?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
  
  const handleDateChange = (date: string) => {
    const newDate = new Date(date);
    onDateRangeChange({ from: newDate, to: newDate });
  };

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

  const renderDashboard = () => {
    switch (selectedRole) {
      case 'admin':
      case 'general_manager':
        return <AdminDashboard 
          realData={realData} 
          selectedDateRange={selectedDateRange} 
          onDateRangeChange={onDateRangeChange} 
        />;
      case 'ops_manager':
        return <OpsManagerDashboard 
          realData={realData} 
          selectedDate={selectedDate} 
          onDateChange={handleDateChange} 
        />;
      case 'qc_controller':
        return <QCDashboard 
          realData={realData} 
          selectedDate={selectedDate} 
          onDateChange={handleDateChange} 
        />;
      case 'technician_l1':
      case 'technician_l2':
      case 'technician_l3':
        return <TechnicianDashboard 
          realData={realData} 
          selectedDateRange={selectedDateRange} 
          onDateRangeChange={onDateRangeChange} 
          technicianLevel={selectedRole} 
        />;
      default:
        return <AdminDashboard 
          realData={realData} 
          selectedDateRange={selectedDateRange} 
          onDateRangeChange={onDateRangeChange} 
        />;
    }
  };

  return (
    <div className="space-y-6">
      {renderDashboard()}
    </div>
  );
};

export default DashboardContainer;
