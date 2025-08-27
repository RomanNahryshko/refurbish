import React from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserRole } from './role-selector';

interface TechnicianDashboardProps {
  mockData: any;
  selectedDateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  technicianLevel: UserRole;
}

const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({ mockData, technicianLevel }) => {
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
              <div className="text-2xl font-bold">{mockData.technicianWorkToday.jobsCompleted}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Active Job</CardTitle>
              <span className="text-2xl">⚡</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.technicianWorkToday.currentActiveJob}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available in Queue</CardTitle>
              <span className="text-2xl">⏳</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.technicianWorkToday.availableInQueue}</div>
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
                {mockData.availableRepairs.map((repair: any) => (
                  <TableRow key={repair.internalId}>
                    <TableCell className="font-medium">{repair.internalId}</TableCell>
                    <TableCell>{repair.model}</TableCell>
                    <TableCell>{repair.repairType}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        repair.waitTime.includes('3h')
                          ? 'bg-red-100 text-red-800' 
                          : repair.waitTime.includes('2h')
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {repair.waitTime}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" disabled>
                        Pick Job
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 3. My Active Job Details */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold">My Active Job</h4>
        <Card>
          <CardHeader>
            <CardTitle>Current Work in Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Internal ID</p>
                <p className="text-lg font-semibold">{mockData.activeJob.internalId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">IMEI</p>
                <p className="text-lg font-semibold">{mockData.activeJob.imei}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Model</p>
                <p className="text-lg font-semibold">{mockData.activeJob.model}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Repair Type</p>
                <p className="text-lg font-semibold">{mockData.activeJob.repairType}</p>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-sm font-medium text-muted-foreground">Started</p>
              <p className="text-lg font-semibold">{mockData.activeJob.startedAgo}</p>
            </div>
            <div className="pt-4">
              <Button variant="outline" className="mr-2" disabled>
                Mark Complete
              </Button>
              <Button variant="outline" disabled>
                Report Issue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
