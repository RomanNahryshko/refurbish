import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface OpsManagerDashboardProps {
  mockData: any;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const OpsManagerDashboard: React.FC<OpsManagerDashboardProps> = ({ mockData }) => {
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
              <div className="text-2xl font-bold">{mockData.opsManagerMetrics.newBatches}</div>
              <p className="text-xs text-muted-foreground">Received today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices Added</CardTitle>
              <span className="text-2xl">📱</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.opsManagerMetrics.devicesAdded}</div>
              <p className="text-xs text-muted-foreground">To system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repairs Created</CardTitle>
              <span className="text-2xl">🔧</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.opsManagerMetrics.repairsCreated}</div>
              <p className="text-xs text-muted-foreground">New repair jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repairs Assigned</CardTitle>
              <span className="text-2xl">👨‍🔧</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.opsManagerMetrics.repairsAssigned}</div>
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
                {mockData.batchStatus.map((batch: any) => (
                  <TableRow key={batch.batchNumber}>
                    <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                    <TableCell>{batch.received}</TableCell>
                    <TableCell>{batch.deviceCount}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        batch.status === 'Complete' 
                          ? 'bg-green-100 text-green-800' 
                          : batch.status === 'Processing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {batch.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 3. Repair Queue Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Repair Queue Overview</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Housing Repairs Pending</CardTitle>
              <span className="text-2xl">🏠</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.repairQueueOverview.housingRepairsPending}</div>
              <p className="text-xs text-muted-foreground">L1 Queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Glass Repairs Pending</CardTitle>
              <span className="text-2xl">🪟</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.repairQueueOverview.glassRepairsPending}</div>
              <p className="text-xs text-muted-foreground">L2 Queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Battery Repairs Pending</CardTitle>
              <span className="text-2xl">🔋</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.repairQueueOverview.batteryRepairsPending}</div>
              <p className="text-xs text-muted-foreground">L3 Queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Other Repairs Pending</CardTitle>
              <span className="text-2xl">⚙️</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.repairQueueOverview.otherRepairsPending}</div>
              <p className="text-xs text-muted-foreground">Mixed Queue</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OpsManagerDashboard;
