'use client';

import React from 'react';
import { DateRange } from 'react-day-picker';
import AdminDashboard from './admin-dashboard';
import OpsManagerDashboard from './ops-manager-dashboard';
import QCDashboard from './qc-dashboard';
import TechnicianDashboard from './technician-dashboard';
import { UserRole } from './role-selector';
import { getMockDataForDateRange } from '@/lib/mock-data/dashboard-data';

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
  // Get mock data for the selected date range
  const mockData = getMockDataForDateRange(selectedDateRange);

  const renderDashboard = () => {
    switch (selectedRole) {
      case 'admin':
      case 'general_manager':
        return <AdminDashboard 
          mockData={mockData} 
          selectedDateRange={selectedDateRange} 
          onDateRangeChange={onDateRangeChange} 
        />;
      case 'ops_manager':
        return <OpsManagerDashboard 
          mockData={mockData} 
          selectedDateRange={selectedDateRange} 
          onDateRangeChange={onDateRangeChange} 
        />;
      case 'qc_controller':
        return <QCDashboard 
          mockData={mockData} 
          selectedDateRange={selectedDateRange} 
          onDateRangeChange={onDateRangeChange} 
        />;
      case 'technician_l1':
      case 'technician_l2':
      case 'technician_l3':
        return <TechnicianDashboard 
          mockData={mockData} 
          selectedDateRange={selectedDateRange} 
          onDateRangeChange={onDateRangeChange} 
          technicianLevel={selectedRole} 
        />;
      default:
        return <AdminDashboard 
          mockData={mockData} 
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
