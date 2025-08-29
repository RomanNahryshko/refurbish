import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardMetrics } from '@/lib/services/dashboard-service';

interface QCDashboardProps {
  realData: DashboardMetrics;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const QCDashboard: React.FC<QCDashboardProps> = ({ realData }) => {
  // Calculate total QC completed today (initial + final)
  const totalQCCompleted = realData.initialQCStats.assignedGrades.gradeA + 
                          realData.initialQCStats.assignedGrades.gradeB + 
                          realData.initialQCStats.assignedGrades.gradeC +
                          realData.finalQCStats.assignedGrades.gradeA +
                          realData.finalQCStats.assignedGrades.gradeB +
                          realData.finalQCStats.assignedGrades.gradeC;

  // Calculate total devices graded
  const totalDevicesGraded = realData.devicesStats.graded;

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
              <div className="text-2xl font-bold">{realData.finalQCStats.generalStats.awaitingQC}</div>
              <p className="text-xs text-muted-foreground">In queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QC Completed Today</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQCCompleted}</div>
              <p className="text-xs text-muted-foreground">Finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices Graded</CardTitle>
              <span className="text-2xl">🏆</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDevicesGraded}</div>
              <p className="text-xs text-muted-foreground">With grades assigned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed QC</CardTitle>
              <span className="text-2xl">❌</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.finalQCStats.generalStats.failedQCCount}</div>
              <p className="text-xs text-muted-foreground">Sent back to repair</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Today's Grade Distribution */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Today&apos;s Grading Distribution</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grade A</CardTitle>
              <span className="text-2xl">🏆</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {realData.initialQCStats.assignedGrades.gradeA + realData.finalQCStats.assignedGrades.gradeA}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalQCCompleted > 0 ? Math.round(((realData.initialQCStats.assignedGrades.gradeA + realData.finalQCStats.assignedGrades.gradeA) / totalQCCompleted) * 100) : 0}% of today&apos;s grades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grade B</CardTitle>
              <span className="text-2xl">🥈</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {realData.initialQCStats.assignedGrades.gradeB + realData.finalQCStats.assignedGrades.gradeB}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalQCCompleted > 0 ? Math.round(((realData.initialQCStats.assignedGrades.gradeB + realData.finalQCStats.assignedGrades.gradeB) / totalQCCompleted) * 100) : 0}% of today&apos;s grades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grade C</CardTitle>
              <span className="text-2xl">🥉</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {realData.initialQCStats.assignedGrades.gradeC + realData.finalQCStats.assignedGrades.gradeC}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalQCCompleted > 0 ? Math.round(((realData.initialQCStats.assignedGrades.gradeC + realData.finalQCStats.assignedGrades.gradeC) / totalQCCompleted) * 100) : 0}% of today&apos;s grades
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Initial vs Final QC Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">QC Breakdown</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Initial QC Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Repairs Assigned:</span>
                  <span className="font-semibold">
                    {realData.initialQCStats.assignedRepairs.housing + 
                     realData.initialQCStats.assignedRepairs.glass + 
                     realData.initialQCStats.assignedRepairs.battery + 
                     realData.initialQCStats.assignedRepairs.software + 
                     realData.initialQCStats.assignedRepairs.other}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Grades Assigned:</span>
                  <span className="font-semibold">
                    {realData.initialQCStats.assignedGrades.gradeA + 
                     realData.initialQCStats.assignedGrades.gradeB + 
                     realData.initialQCStats.assignedGrades.gradeC}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Housing Repairs:</span>
                  <span className="font-semibold">{realData.initialQCStats.assignedRepairs.housing}</span>
                </div>
                <div className="flex justify-between">
                  <span>Glass Repairs:</span>
                  <span className="font-semibold">{realData.initialQCStats.assignedRepairs.glass}</span>
                </div>
                <div className="flex justify-between">
                  <span>Battery Repairs:</span>
                  <span className="font-semibold">{realData.initialQCStats.assignedRepairs.battery}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Final QC Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Awaiting QC:</span>
                  <span className="font-semibold">{realData.finalQCStats.generalStats.awaitingQC}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed QC:</span>
                  <span className="font-semibold">{realData.finalQCStats.generalStats.failedQCCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grade A:</span>
                  <span className="font-semibold">{realData.finalQCStats.assignedGrades.gradeA}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grade B:</span>
                  <span className="font-semibold">{realData.finalQCStats.assignedGrades.gradeB}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grade C:</span>
                  <span className="font-semibold">{realData.finalQCStats.assignedGrades.gradeC}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Device Status Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Device Status Overview</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Received</CardTitle>
              <span className="text-2xl">📦</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.devicesStats.importedDevices}</div>
              <p className="text-xs text-muted-foreground">Total devices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Repair</CardTitle>
              <span className="text-2xl">⏳</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.devicesStats.awaitingRepair}</div>
              <p className="text-xs text-muted-foreground">Ready for repair</p>
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
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.devicesStats.graded}</div>
              <p className="text-xs text-muted-foreground">Successfully graded</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QCDashboard;
