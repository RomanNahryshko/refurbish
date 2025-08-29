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

/** 
 * Reusable statistic card with icon, label, value and optional description.
 */
const StatCard: React.FC<{
  icon: string;
  label: string;
  value: number | string;
  description?: string;
}> = ({ icon, label, value, description }) => (
  <Card className="p-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
  </Card>
);

/**
 * Grid wrapper for rendering multiple StatCards
 */
const StatsGrid: React.FC<{
  items: { icon: string; label: string; value: number | string; description?: string }[];
  cols?: number;
}> = ({ items, cols = 3 }) => (
  <div className={`grid gap-2 md:grid-cols-${cols}`}>
    {items.map((item, i) => (
      <StatCard key={i} {...item} />
    ))}
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ realData }) => {
  /**
   * Helper function to calculate percentages for devices statistics.
   */
  const getDevicesStatsWithPercentages = (devicesStats: DashboardMetrics['devicesStats']) => {
    const stats = [
      { status: 'Expected Devices', count: devicesStats.expectedDevices, color: '#3B82F6' },
      { status: 'Imported Devices', count: devicesStats.importedDevices, color: '#10B981' },
      { status: 'Awaiting Repair', count: devicesStats.awaitingRepair, color: '#F59E0B' },
      { status: 'In Repair', count: devicesStats.inRepair, color: '#EF4444' },
      { status: 'Final QC', count: devicesStats.finalQC, color: '#8B5CF6' },
      { status: 'Graded', count: devicesStats.graded, color: '#06B6D4' },
    ];

    const totalCount = stats.reduce((sum, item) => sum + item.count, 0);
    return stats.map((item) => ({
      ...item,
      percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0,
    }));
  };

  const devicesStatsWithPercentages = getDevicesStatsWithPercentages(realData.devicesStats);

  return (
    <div className="space-y-6">
      {/* 1. Batch Intake Stats */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Batch Intake Stats</h2>
        <StatsGrid
          cols={3}
          items={[
            {
              icon: '📦',
              label: 'Batches Created',
              value: realData.batchIntakeStats.batchesCreated,
              description: 'Total batches',
            },
            {
              icon: '🎯',
              label: 'Expected Devices',
              value: realData.batchIntakeStats.expectedDevicesCount,
              description: 'Across all batches',
            },
            {
              icon: '✅',
              label: 'Imported Devices',
              value: realData.batchIntakeStats.importedDevicesCount,
              description: 'Successfully imported',
            },
          ]}
        />
      </section>

      {/* 2. Initial QC Stats */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Initial QC Stats</h2>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Assigned Repairs</h4>
          <StatsGrid
            cols={5}
            items={[
              { icon: '🏠', label: 'Housing', value: realData.initialQCStats.assignedRepairs.housing },
              { icon: '🪟', label: 'Glass', value: realData.initialQCStats.assignedRepairs.glass },
              { icon: '🔋', label: 'Battery', value: realData.initialQCStats.assignedRepairs.battery },
              { icon: '💾', label: 'Software', value: realData.initialQCStats.assignedRepairs.software },
              { icon: '🔧', label: 'Other', value: realData.initialQCStats.assignedRepairs.other },
            ]}
          />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Assigned Grades</h4>
          <StatsGrid
            cols={3}
            items={[
              { icon: '🏆', label: 'Grade A', value: realData.initialQCStats.initialGrades.gradeA },
              { icon: '🥈', label: 'Grade B', value: realData.initialQCStats.initialGrades.gradeB },
              { icon: '🥉', label: 'Grade C', value: realData.initialQCStats.initialGrades.gradeC },
            ]}
          />
        </div>
      </section>

      {/* 3. Final QC Stats */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Final QC Stats</h2>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">General Stats</h4>
          <StatsGrid
            cols={2}
            items={[
              { icon: '⏳', label: 'Awaiting QC', value: realData.finalQCStats.generalStats.awaitingQC },
              { icon: '❌', label: 'Failed QC Count', value: realData.finalQCStats.generalStats.failedQCCount },
            ]}
          />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Assigned Grades</h4>
          <StatsGrid
            cols={3}
            items={[
              { icon: '🏆', label: 'Grade A', value: realData.finalQCStats.assignedGrades.gradeA },
              { icon: '🥈', label: 'Grade B', value: realData.finalQCStats.assignedGrades.gradeB },
              { icon: '🥉', label: 'Grade C', value: realData.finalQCStats.assignedGrades.gradeC },
            ]}
          />
        </div>
      </section>

      {/* 4. Devices Stats */}
      <section className="space-y-4">
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

                        const startAngle = devicesStatsWithPercentages
                          .slice(0, index)
                          .reduce((sum, d) => sum + (d.count / totalCount) * 360, 0);
                        const endAngle = startAngle + (item.count / totalCount) * 360;
                        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

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
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="truncate">{item.status}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5. Repair Stats */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Repair Stats</h2>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Completed Repairs</h4>
          <StatsGrid
            cols={5}
            items={[
              { icon: '🏠', label: 'Housing', value: realData.repairStats.completedRepairs.housing },
              { icon: '🪟', label: 'Glass', value: realData.repairStats.completedRepairs.glass },
              { icon: '🔋', label: 'Battery', value: realData.repairStats.completedRepairs.battery },
              { icon: '💾', label: 'Software', value: realData.repairStats.completedRepairs.software },
              { icon: '🔧', label: 'Other', value: realData.repairStats.completedRepairs.other },
            ]}
          />
        </div>
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
                    <div className="text-lg font-bold">
                      {Object.values(realData.repairStats.technicianUtilization).reduce(
                        (sum, level) => sum + level.availableTechnicians,
                        0
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Jobs Completed</span>
                    <div className="text-lg font-bold">
                      {Object.values(realData.repairStats.technicianUtilization).reduce(
                        (sum, level) => sum + level.completedToday,
                        0
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto border-t pt-2">
                  {Object.values(realData.repairStats.technicianUtilization)
                    .flatMap(level => level.technicians)
                    .map((tech, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate">{tech.name}</span>
                        <span className="font-medium">{tech.completedToday}</span>
                      </div>
                    ))}
                </div>
              </div>
            </Card>
            <StatCard
              icon="📊"
              label="Avg Jobs/Tech"
              value={(() => {
                const totalTechs = Object.values(realData.repairStats.technicianUtilization).reduce(
                  (sum, level) => sum + level.availableTechnicians,
                  0
                );
                const totalCompleted = Object.values(realData.repairStats.technicianUtilization).reduce(
                  (sum, level) => sum + level.completedToday,
                  0
                );
                return totalTechs > 0 ? Math.round(totalCompleted / totalTechs) : 0;
              })()}
            />
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Workload by Technician Level</h4>
          {/* Debug info */}
          <div className="text-xs text-muted-foreground p-2 bg-gray-100 rounded">
            Debug: L1: {realData.repairStats.technicianUtilization.L1.availableTechnicians} techs, 
            L2: {realData.repairStats.technicianUtilization.L2.availableTechnicians} techs, 
            L3: {realData.repairStats.technicianUtilization.L3.availableTechnicians} techs
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(['L1', 'L2', 'L3'] as const).map((level) => {
              const levelData = realData.repairStats.technicianUtilization[level];
              // Показываем только уровни с техниками
              if (!levelData || levelData.availableTechnicians === 0) return null;
              
              return (
                <Card key={`${level}-${levelData.availableTechnicians}`} className="p-4">
                  <div className="space-y-3">
                    <div className="border-b pb-2 mb-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-lg">Level {level}</h5>
                        <div className="text-xs text-muted-foreground">
                          Active/Completed: {levelData.activeJobs}/{levelData.completedToday}, Avg/Tech:{' '}
                          {levelData.averagePerTech}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h6 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Technicians</h6>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {levelData.technicians?.map((tech, index) => (
                          <div key={`${level}-${tech.name}-${index}`} className="flex justify-between items-center text-xs py-1">
                            <span className="font-medium truncate flex-1">{tech.name}</span>
                            <span className="text-muted-foreground">{tech.completedToday}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
