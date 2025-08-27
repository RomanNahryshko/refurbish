import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface QCDashboardProps {
  mockData: any;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const QCDashboard: React.FC<QCDashboardProps> = ({ mockData }) => {
  return (
    <div className="space-y-6">
      {/* 1. QC Workload Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">QC Workload</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Final QC</CardTitle>
              <span className="text-2xl">⏳</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.qcWorkload.awaitingFinalQC}</div>
              <p className="text-xs text-muted-foreground">In queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QC Completed Today</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.qcWorkload.qcCompletedToday}</div>
              <p className="text-xs text-muted-foreground">Finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices Graded</CardTitle>
              <span className="text-2xl">🏆</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.qcWorkload.devicesGraded}</div>
              <p className="text-xs text-muted-foreground">With grades assigned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed QC</CardTitle>
              <span className="text-2xl">❌</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.qcWorkload.failedQC}</div>
              <p className="text-xs text-muted-foreground">Sent back to repair</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Today's Grade Distribution */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Today's Grading Distribution</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grade A</CardTitle>
              <span className="text-2xl">🏆</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.todayGradeDistribution.gradeA.count}</div>
              <p className="text-xs text-muted-foreground">{mockData.todayGradeDistribution.gradeA.percentage}% of today's grades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grade B</CardTitle>
              <span className="text-2xl">🥈</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.todayGradeDistribution.gradeB.count}</div>
              <p className="text-xs text-muted-foreground">{mockData.todayGradeDistribution.gradeB.percentage}% of today's grades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grade C</CardTitle>
              <span className="text-2xl">🥉</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.todayGradeDistribution.gradeC.count}</div>
              <p className="text-xs text-muted-foreground">{mockData.todayGradeDistribution.gradeC.percentage}% of today's grades</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. QC Queue Table (top 5) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">QC Queue (Top 5)</h3>
        <Card>
          <CardHeader>
            <CardTitle>Devices Awaiting Final QC</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Internal ID</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Time in Queue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.qcQueue.map((device: any) => (
                  <TableRow key={device.internalId}>
                    <TableCell className="font-medium">{device.internalId}</TableCell>
                    <TableCell>{device.imei}</TableCell>
                    <TableCell>{device.model}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        device.timeInQueue.includes('h') && parseInt(device.timeInQueue) > 2
                          ? 'bg-red-100 text-red-800' 
                          : device.timeInQueue.includes('h')
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {device.timeInQueue}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QCDashboard;
