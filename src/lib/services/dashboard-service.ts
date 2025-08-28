import { SupabaseClient } from '@supabase/supabase-js';

export interface DashboardMetrics {
  batchIntakeStats: {
    batchesCreated: number;
    expectedDevicesCount: number;
    importedDevicesCount: number;
  };
  initialQCStats: {
    assignedRepairs: {
      housing: number;
      glass: number;
      battery: number;
      software: number;
      other: number;
    };
    assignedGrades: {
      gradeA: number;
      gradeB: number;
      gradeC: number;
    };
  };
  finalQCStats: {
    generalStats: {
      awaitingQC: number;
      failedQCCount: number;
    };
    assignedGrades: {
      gradeA: number;
      gradeB: number;
      gradeC: number;
    };
  };
  devicesStats: {
    expectedDevices: number;
    importedDevices: number;
    awaitingRepair: number;
    inRepair: number;
    finalQC: number;
    graded: number;
  };
  repairStats: {
    completedRepairs: {
      housing: number;
      glass: number;
      battery: number;
      software: number;
      other: number;
    };
    technicianUtilization: {
      L1: {
        availableTechnicians: number;
        activeJobs: number;
        completedToday: number;
        averagePerTech: number;
      };
      L2: {
        availableTechnicians: number;
        activeJobs: number;
        completedToday: number;
        averagePerTech: number;
      };
      L3: {
        availableTechnicians: number;
        activeJobs: number;
        completedToday: number;
        averagePerTech: number;
      };
    };
  };
}

export class DashboardService {
  constructor(private supabase: SupabaseClient) {}

  async getDashboardMetrics(dateRange?: { from: Date; to: Date }): Promise<DashboardMetrics> {
    try {
      // Get production metrics from the production_metrics table
      const productionMetrics = await this.getProductionMetrics(dateRange);
      
      // Get additional data that's not in production_metrics
      const [batchIntakeStats, technicianUtilization] = await Promise.all([
        this.getBatchIntakeStats(dateRange),
        this.getTechnicianUtilization(),
      ]);

      return {
        batchIntakeStats,
        initialQCStats: {
          assignedRepairs: {
            housing: productionMetrics.housing_changes,
            glass: productionMetrics.glass_changes,
            battery: productionMetrics.battery_changes,
            software: productionMetrics.software_updates,
            other: productionMetrics.other_repairs,
          },
          assignedGrades: {
            gradeA: productionMetrics.grade_a_count,
            gradeB: productionMetrics.grade_b_count,
            gradeC: productionMetrics.grade_c_count,
          },
        },
        finalQCStats: {
          generalStats: {
            awaitingQC: productionMetrics.devices_in_repair,
            failedQCCount: 0, // Not available in production_metrics, would need separate query
          },
          assignedGrades: {
            gradeA: productionMetrics.grade_a_count,
            gradeB: productionMetrics.grade_b_count,
            gradeC: productionMetrics.grade_c_count,
          },
        },
        devicesStats: {
          expectedDevices: batchIntakeStats.expectedDevicesCount,
          importedDevices: productionMetrics.devices_received,
          awaitingRepair: productionMetrics.devices_in_repair,
          inRepair: productionMetrics.devices_in_repair,
          finalQC: productionMetrics.devices_in_repair, // Approximate
          graded: productionMetrics.devices_completed,
        },
        repairStats: {
          completedRepairs: {
            housing: productionMetrics.housing_changes,
            glass: productionMetrics.glass_changes,
            battery: productionMetrics.battery_changes,
            software: productionMetrics.software_updates,
            other: productionMetrics.other_repairs,
          },
          technicianUtilization,
        },
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  private async getProductionMetrics(dateRange?: { from: Date; to: Date }) {
    let query = this.supabase
      .from('production_metrics')
      .select('*')
      .order('metric_date', { ascending: false });

    if (dateRange) {
      query = query.gte('metric_date', dateRange.from.toISOString().split('T')[0])
                   .lte('metric_date', dateRange.to.toISOString().split('T')[0]);
    }

    const { data: metrics, error } = await query;

    if (error) throw error;

    if (!metrics || metrics.length === 0) {
      // Return default values if no metrics found
      return {
        devices_received: 0,
        devices_in_repair: 0,
        devices_completed: 0,
        devices_shipped: 0,
        housing_changes: 0,
        glass_changes: 0,
        battery_changes: 0,
        software_updates: 0,
        other_repairs: 0,
        grade_a_count: 0,
        grade_b_count: 0,
        grade_c_count: 0,
      };
    }

    // If date range is specified, sum all metrics in the range
    if (dateRange) {
      return metrics.reduce((sum, metric) => ({
        devices_received: sum.devices_received + (metric.devices_received || 0),
        devices_in_repair: sum.devices_in_repair + (metric.devices_in_repair || 0),
        devices_completed: sum.devices_completed + (metric.devices_completed || 0),
        devices_shipped: sum.devices_shipped + (metric.devices_shipped || 0),
        housing_changes: sum.housing_changes + (metric.housing_changes || 0),
        glass_changes: sum.glass_changes + (metric.glass_changes || 0),
        battery_changes: sum.battery_changes + (metric.battery_changes || 0),
        software_updates: sum.software_updates + (metric.software_updates || 0),
        other_repairs: sum.other_repairs + (metric.other_repairs || 0),
        grade_a_count: sum.grade_a_count + (metric.grade_a_count || 0),
        grade_b_count: sum.grade_b_count + (metric.grade_b_count || 0),
        grade_c_count: sum.grade_c_count + (metric.grade_c_count || 0),
      }), {
        devices_received: 0,
        devices_in_repair: 0,
        devices_completed: 0,
        devices_shipped: 0,
        housing_changes: 0,
        glass_changes: 0,
        battery_changes: 0,
        software_updates: 0,
        other_repairs: 0,
        grade_a_count: 0,
        grade_b_count: 0,
        grade_c_count: 0,
      });
    }

    // If no date range, return the most recent metrics
    return metrics[0];
  }

  private async getBatchIntakeStats(dateRange?: { from: Date; to: Date }) {
    let query = this.supabase
      .from('batches')
      .select('device_count, created_at')
      .is('deleted_at', null);

    if (dateRange) {
      query = query.gte('created_at', dateRange.from.toISOString()).lte('created_at', dateRange.to.toISOString());
    }

    const { data: batches, error } = await query;

    if (error) throw error;

    const batchesCreated = batches?.length || 0;
    const expectedDevicesCount = batches?.reduce((sum, batch) => sum + (batch.device_count || 0), 0) || 0;

    // For imported devices, we'll use the devices_received from production_metrics
    const { data: productionMetrics } = await this.supabase
      .from('production_metrics')
      .select('devices_received')
      .order('metric_date', { ascending: false })
      .limit(1);

    const importedDevicesCount = productionMetrics?.[0]?.devices_received || 0;

    return {
      batchesCreated,
      expectedDevicesCount,
      importedDevicesCount,
    };
  }

  private async getTechnicianUtilization() {
    // Get technician utilization by level
    const { data: technicians, error: techError } = await this.supabase
      .from('user_profiles')
      .select('id, full_name, technician_level')
      .eq('role', 'technician')
      .is('deleted_at', null);

    if (techError) throw techError;

    const technicianUtilization = {
      L1: await this.getTechnicianLevelStats('L1', technicians),
      L2: await this.getTechnicianLevelStats('L2', technicians),
      L3: await this.getTechnicianLevelStats('L3', technicians),
    };

    return technicianUtilization;
  }

  private async getTechnicianLevelStats(
    level: 'L1' | 'L2' | 'L3',
    technicians: { id: string; technician_level: string }[]
  ) {
    const levelTechnicians = technicians?.filter(tech => tech.technician_level === level) || [];
    const availableTechnicians = levelTechnicians.length;

    if (availableTechnicians === 0) {
      return {
        availableTechnicians: 0,
        activeJobs: 0,
        completedToday: 0,
        averagePerTech: 0,
      };
    }

    const technicianIds = levelTechnicians.map(tech => tech.id);

    // Get active jobs for this level
    const { data: activeJobs, error: activeError } = await this.supabase
      .from('repair_jobs')
      .select('id, status')
      .in('assigned_to', technicianIds)
      .in('status', ['pending', 'in_progress'])
      .is('deleted_at', null);

    if (activeError) throw activeError;

    const activeJobsCount = activeJobs?.length || 0;

    // Get completed jobs for this level (today)
    const today = new Date().toISOString().split('T')[0];
    const { data: completedJobs, error: completedError } = await this.supabase
      .from('repair_jobs')
      .select('id, completed_at')
      .in('assigned_to', technicianIds)
      .eq('status', 'completed')
      .gte('completed_at', today)
      .is('deleted_at', null);

    if (completedError) throw completedError;

    const completedToday = completedJobs?.length || 0;
    const averagePerTech = availableTechnicians > 0 ? Math.round(completedToday / availableTechnicians) : 0;

    return {
      availableTechnicians,
      activeJobs: activeJobsCount,
      completedToday,
      averagePerTech,
    };
  }
}
