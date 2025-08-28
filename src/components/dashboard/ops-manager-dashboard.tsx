import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DashboardMetrics } from '@/lib/services/dashboard-service';

interface OpsManagerDashboardProps {
  realData: DashboardMetrics;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const OpsManagerDashboard: React.FC<OpsManagerDashboardProps> = ({ realData }) => {
  return (
    <div className="space-y-6">
      {/* 1. Today's Operations Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Today's Operations</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Batches</CardTitle>
              <span className="text-2xl">📦</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.batchIntakeStats.batchesCreated}</div>
              <p className="text-xs text-muted-foreground">Received today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices Added</CardTitle>
              <span className="text-2xl">📱</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.batchIntakeStats.importedDevicesCount}</div>
              <p className="text-xs text-muted-foreground">To system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repairs Created</CardTitle>
              <span className="text-2xl">🔧</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {realData.initialQCStats.assignedRepairs.housing + 
                 realData.initialQCStats.assignedRepairs.glass + 
                 realData.initialQCStats.assignedRepairs.battery + 
                 realData.initialQCStats.assignedRepairs.software + 
                 realData.initialQCStats.assignedRepairs.other}
              </div>
              <p className="text-xs text-muted-foreground">New repair jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repairs Assigned</CardTitle>
              <span className="text-2xl">👨‍🔧</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {realData.repairStats.technicianUtilization.L1.activeJobs + 
                 realData.repairStats.technicianUtilization.L2.activeJobs + 
                 realData.repairStats.technicianUtilization.L3.activeJobs}
              </div>
              <p className="text-xs text-muted-foreground">To technicians</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Batch Status Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Batches</h3>
        <Card>
          <CardHeader>
            <CardTitle>Batch Processing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">BATCH-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001</TableCell>
                  <TableCell>{new Date().toLocaleDateString()}</TableCell>
                  <TableCell>{realData.batchIntakeStats.expectedDevicesCount}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Processing
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 3. Device Status Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Device Status Overview</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Repair</CardTitle>
              <span className="text-2xl">⏳</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.devicesStats.awaitingRepair}</div>
              <p className="text-xs text-muted-foreground">Devices ready for repair</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Repair</CardTitle>
              <span className="text-2xl">🔧</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.devicesStats.inRepair}</div>
              <p className="text-xs text-muted-foreground">Currently being repaired</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Final QC</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.devicesStats.finalQC}</div>
              <p className="text-xs text-muted-foreground">Ready for final inspection</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <span className="text-2xl">🎉</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.devicesStats.graded}</div>
              <p className="text-xs text-muted-foreground">Successfully graded</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Technician Utilization */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Technician Utilization</h3>
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
    </div>
  );
};

export default OpsManagerDashboard;
