import React from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserRole } from './role-selector';
import { DashboardMetrics } from '@/lib/services/dashboard-service';

interface TechnicianDashboardProps {
  realData: DashboardMetrics;
  selectedDateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  technicianLevel: UserRole;
}

const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({ realData, technicianLevel }) => {
  // Filter repair type based on technician level
  const getRepairType = () => {
    switch (technicianLevel) {
      case 'technician_l1':
        return 'Housing Change';
      case 'technician_l2':
        return 'Glass Change';
      case 'technician_l3':
        return 'Battery Change';
      default:
        return 'Housing Change';
    }
  };

  // Get technician level stats
  const getTechnicianLevelStats = () => {
    switch (technicianLevel) {
      case 'technician_l1':
        return realData.repairStats.technicianUtilization.L1;
      case 'technician_l2':
        return realData.repairStats.technicianUtilization.L2;
      case 'technician_l3':
        return realData.repairStats.technicianUtilization.L3;
      default:
        return realData.repairStats.technicianUtilization.L1;
    }
  };

  const levelStats = getTechnicianLevelStats();

  return (
    <div className="space-y-6">
      {/* 1. My Work Today Cards */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold">My Work Today</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{levelStats.completedToday}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Active Job</CardTitle>
              <span className="text-2xl">⚡</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{levelStats.activeJobs}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available in Queue</CardTitle>
              <span className="text-2xl">⏳</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.devicesStats.awaitingRepair}</div>
              <p className="text-xs text-muted-foreground">Ready to pick</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Available Repairs Table (filtered by level) */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold">Available Repairs ({getRepairType()})</h4>
        <Card>
          <CardHeader>
            <CardTitle>Jobs Available for Your Level</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Internal ID</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Repair Type</TableHead>
                  <TableHead>Wait Time</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Sample Device</TableCell>
                  <TableCell>iPhone 12</TableCell>
                  <TableCell>{getRepairType()}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      1h
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button size="sm">Start Repair</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 3. My Performance Stats */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold">My Performance Stats</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Today's Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Jobs Completed:</span>
                  <span className="font-semibold">{levelStats.completedToday}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Jobs:</span>
                  <span className="font-semibold">{levelStats.activeJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average per Tech:</span>
                  <span className="font-semibold">{levelStats.averagePerTech}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Queue Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Devices Awaiting Repair:</span>
                  <span className="font-semibold">{realData.devicesStats.awaitingRepair}</span>
                </div>
                <div className="flex justify-between">
                  <span>Devices In Repair:</span>
                  <span className="font-semibold">{realData.devicesStats.inRepair}</span>
                </div>
                <div className="flex justify-between">
                  <span>Devices Completed:</span>
                  <span className="font-semibold">{realData.devicesStats.graded}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Team Overview */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold">Team Overview</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>L1 Technicians (Housing)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Available:</span>
                  <span className="font-semibold">{realData.repairStats.technicianUtilization.L1.availableTechnicians}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Jobs:</span>
                  <span className="font-semibold">{realData.repairStats.technicianUtilization.L1.activeJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed Today:</span>
                  <span className="font-semibold">{realData.repairStats.technicianUtilization.L1.completedToday}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>L2 Technicians (Glass)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Available:</span>
                  <span className="font-semibold">{realData.repairStats.technicianUtilization.L2.availableTechnicians}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Jobs:</span>
                  <span className="font-semibold">{realData.repairStats.technicianUtilization.L2.activeJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed Today:</span>
                  <span className="font-semibold">{realData.repairStats.technicianUtilization.L2.completedToday}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>L3 Technicians (Battery/Other)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Available:</span>
                  <span className="font-semibold">{realData.repairStats.technicianUtilization.L3.availableTechnicians}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Jobs:</span>
                  <span className="font-semibold">{realData.repairStats.technicianUtilization.L3.activeJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed Today:</span>
                  <span className="font-semibold">{realData.repairStats.technicianUtilization.L3.completedToday}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 5. Recent Activity */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold">Recent Activity</h4>
        <Card>
          <CardHeader>
            <CardTitle>Today's Completed Repairs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Housing Changes:</span>
                <span className="font-medium">{realData.repairStats.completedRepairs.housing}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Glass Changes:</span>
                <span className="font-medium">{realData.repairStats.completedRepairs.glass}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Battery Changes:</span>
                <span className="font-medium">{realData.repairStats.completedRepairs.battery}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Software Updates:</span>
                <span className="font-medium">{realData.repairStats.completedRepairs.software}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Other Repairs:</span>
                <span className="font-medium">{realData.repairStats.completedRepairs.other}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
