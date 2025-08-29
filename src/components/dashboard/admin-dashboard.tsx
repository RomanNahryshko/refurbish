import React from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DashboardMetrics } from '@/lib/services/dashboard-service';

interface AdminDashboardProps {
  realData: DashboardMetrics;
  selectedDateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ realData }) => {
  // Calculate percentages for device stats
  const getDevicesStatsWithPercentages = (devicesStats: DashboardMetrics['devicesStats']) => {
    const stats = [
      { status: 'Expected Devices', count: devicesStats.expectedDevices, color: '#3B82F6' },
      { status: 'Imported Devices', count: devicesStats.importedDevices, color: '#10B981' },
      { status: 'Awaiting Repair', count: devicesStats.awaitingRepair, color: '#F59E0B' },
      { status: 'In Repair', count: devicesStats.inRepair, color: '#EF4444' },
      { status: 'Final QC', count: devicesStats.finalQC, color: '#8B5CF6' },
      { status: 'Graded', count: devicesStats.graded, color: '#06B6D4' },
    ];

    // Calculate total for percentage calculation
    const totalCount = stats.reduce((sum, item) => sum + item.count, 0);
    
    // Add percentage to each stat
    const statsWithPercentages = stats.map(item => ({
      ...item,
      percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
    }));

    return statsWithPercentages;
  };

  const devicesStatsWithPercentages = getDevicesStatsWithPercentages(realData.devicesStats);
  console.log(realData, 'realData')

  return (
    <div className="space-y-6">
      {/* 1. Batch Intake Stats */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Batch Intake Stats</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Batches Created</CardTitle>
              <span className="text-2xl">📦</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.batchIntakeStats.batchesCreated}</div>
              <p className="text-xs text-muted-foreground">Total batches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expected Devices</CardTitle>
              <span className="text-2xl">🎯</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.batchIntakeStats.expectedDevicesCount}</div>
              <p className="text-xs text-muted-foreground">Across all batches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imported Devices</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realData.batchIntakeStats.importedDevicesCount}</div>
              <p className="text-xs text-muted-foreground">Successfully imported</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Initial QC Stats */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Initial QC Stats</h2>
        
        {/* Assigned Repairs Row */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Assigned Repairs</h4>
          <div className="grid gap-2 md:grid-cols-5">
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏠</span>
                  <span className="text-sm font-medium">Housing</span>
                </div>
                <div className="text-lg font-bold">{realData.initialQCStats.assignedRepairs.housing}</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🪟</span>
                  <span className="text-sm font-medium">Glass</span>
                </div>
                <div className="text-lg font-bold">{realData.initialQCStats.assignedRepairs.glass}</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔋</span>
                  <span className="text-sm font-medium">Battery</span>
                </div>
                <div className="text-lg font-bold">{realData.initialQCStats.assignedRepairs.battery}</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💾</span>
                  <span className="text-sm font-medium">Software</span>
                </div>
                <div className="text-lg font-bold">{realData.initialQCStats.assignedRepairs.software}</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔧</span>
                  <span className="text-sm font-medium">Other</span>
                </div>
                <div className="text-lg font-bold">{realData.initialQCStats.assignedRepairs.other}</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Assigned Grades Row */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Assigned Grades</h4>
          <div className="grid gap-2 md:grid-cols-3">
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <span className="text-sm font-medium">Grade A</span>
                </div>
                <div className="text-lg font-bold">{realData.initialQCStats.initialGrades.gradeA}</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥈</span>
                  <span className="text-sm font-medium">Grade B</span>
                </div>
                <div className="text-lg font-bold">{realData.initialQCStats.initialGrades.gradeB}</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥉</span>
                  <span className="text-sm font-medium">Grade C</span>
                </div>
                <div className="text-lg font-bold">{realData.initialQCStats.initialGrades.gradeC}</div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* 3. Final QC Stats */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Final QC Stats</h2>
        
        {/* General Stats Row */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">General Stats</h4>
          <div className="grid gap-2 md:grid-cols-2">
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏳</span>
                  <span className="text-sm font-medium">Awaiting QC</span>
                </div>
                <div className="text-lg font-bold">{realData.finalQCStats.generalStats.awaitingQC}</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">❌</span>
                  <span className="text-sm font-medium">Failed QC Count</span>
                </div>
                <div className="text-lg font-bold">{realData.finalQCStats.generalStats.failedQCCount}</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Assigned Grades Row */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Assigned Grades</h4>
          <div className="grid gap-2 md:grid-cols-3">
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <span className="text-sm font-medium">Grade A</span>
                </div>
                <div className="text-lg font-bold">{realData.finalQCStats.assignedGrades.gradeA}</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥈</span>
                  <span className="text-sm font-medium">Grade B</span>
                </div>
                <div className="text-lg font-bold">{realData.finalQCStats.assignedGrades.gradeB}</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥉</span>
                  <span className="text-sm font-medium">Grade C</span>
                </div>
                <div className="text-lg font-bold">{realData.finalQCStats.assignedGrades.gradeC}</div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* 4. Devices Stats */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Devices Stats</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Device Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devicesStatsWithPercentages.map((item) => (
                    <TableRow key={item.status}>
                      <TableCell className="font-medium">{item.status}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>{item.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Donut Chart Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Visual Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {(() => {
                      const totalCount = devicesStatsWithPercentages.reduce((sum, d) => sum + d.count, 0);
                      
                      return devicesStatsWithPercentages.map((item, index) => {
                        if (item.count === 0) return null;
                        
                        // Calculate cumulative angles for proper donut chart segments
                        const startAngle = devicesStatsWithPercentages.slice(0, index).reduce((sum, d) => sum + (d.count / totalCount) * 360, 0);
                        const endAngle = startAngle + (item.count / totalCount) * 360;
                        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                        
                        // Convert angles to radians and calculate SVG path coordinates
                        const startX = 50 + 35 * Math.cos((startAngle * Math.PI) / 180);
                        const startY = 50 + 35 * Math.sin((startAngle * Math.PI) / 180);
                        const endX = 50 + 35 * Math.cos((endAngle * Math.PI) / 180);
                        const endY = 50 + 35 * Math.sin((endAngle * Math.PI) / 180);
                        
                        return (
                          <path
                            key={item.status}
                            d={`M 50 50 L ${startX} ${startY} A 35 35 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                            fill={item.color}
                            className="hover:opacity-80 transition-opacity"
                          />
                        );
                      });
                    })()}
                    <circle cx="50" cy="50" r="20" fill="white" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm font-medium">Total</div>
                      <div className="text-lg font-bold">{realData.devicesStats.expectedDevices}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {devicesStatsWithPercentages.length === 0 ? (
                  <div className="col-span-2 text-center text-muted-foreground">
                    No device data available
                  </div>
                ) : (
                  devicesStatsWithPercentages.map((item) => (
                    <div key={item.status} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="truncate">{item.status}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 5. Repair Stats */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Repair Stats</h2>
        
        {/* Completed Repairs Row */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Completed Repairs</h4>
          <div className="grid gap-2 md:grid-cols-5">
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏠</span>
                  <span className="text-sm font-medium">Housing</span>
                </div>
                <div className="text-lg font-bold">{realData.repairStats.completedRepairs.housing}</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🪟</span>
                  <span className="text-sm font-medium">Glass</span>
                </div>
                <div className="text-lg font-bold">{realData.repairStats.completedRepairs.glass}</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔋</span>
                  <span className="text-sm font-medium">Battery</span>
                </div>
                <div className="text-lg font-bold">{realData.repairStats.completedRepairs.battery}</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💾</span>
                  <span className="text-sm font-medium">Software</span>
                </div>
                <div className="text-lg font-bold">{realData.repairStats.completedRepairs.software}</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔧</span>
                  <span className="text-sm font-medium">Other</span>
                </div>
                <div className="text-lg font-bold">{realData.repairStats.completedRepairs.other}</div>
              </div>
            </Card>
          </div>
        </div>
   {/* Technician Utilization Row */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Technician Utilization</h4>
          <div className="grid gap-2 md:grid-cols-3">
            <Card className="p-4 md:col-span-2">
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👥</span>
                      <span className="text-sm font-medium">Total Active Technicians</span>
                    </div>
                    <div className="text-lg font-bold">{realData.repairStats.technicianUtilization.activeTechnicians}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Jobs Completed</span>
                    <div className="text-lg font-bold">{realData.repairStats.technicianUtilization.techniciansList?.reduce((sum: number, tech: any) => sum + tech.jobsCompleted, 0)}</div>
                  </div>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto border-t pt-2">
                  {realData.repairStats.technicianUtilization.techniciansList?.map((tech: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate">{tech.name}</span>
                      <span className="font-medium">{tech.jobsCompleted}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <span className="text-sm font-medium">Avg Jobs/Tech</span>
                </div>
                <div className="text-lg font-bold">{realData.repairStats.technicianUtilization.avgJobsPerTech}</div>
              </div>
            </Card>
          </div>
        </div>
      {/* Workload by Technician Level */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Workload by Technician Level</h4>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(realData.repairStats.technicianUtilization)?.map(([level, levelData]) => (
              <Card key={level} className="p-4">
                <div className="space-y-3">
                  {/* Level Summary */}
                  <div className="border-b pb-2 mb-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-lg">Level {level}</h5>
                      <div className="text-xs text-muted-foreground">
                        Active/Completed: {levelData.activeJobs}/{levelData.completedToday}, Avg/Tech: {levelData.averagePerTech}
                      </div>
                    </div>
                  </div>

                  {/* Individual Technicians */}
                  <div className="space-y-2">
                    <h6 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Technicians</h6>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {levelData.technicians?.map((tech, index) => (
                        <div key={index} className="flex justify-between items-center text-xs py-1">
                          <span className="font-medium truncate flex-1">{tech.name}</span>
                          <span className="text-muted-foreground">{tech.completedToday}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
