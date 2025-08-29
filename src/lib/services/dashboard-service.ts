import { SupabaseClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

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
    initialGrades: {
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
      activeTechnicians: number;
      avgJobsPerTech: number;
      techniciansList: Array<{
        name: string;
        jobsCompleted: number;
      }>;
      L1: {
        availableTechnicians: number;
        activeJobs: number;
        completedToday: number;
        averagePerTech: number;
        technicians: Array<{
          name: string;
          completedToday: number;
        }>;
      };
      L2: {
        availableTechnicians: number;
        activeJobs: number;
        completedToday: number;
        averagePerTech: number;
        technicians: Array<{
          name: string;
          completedToday: number;
        }>;
      };
      L3: {
        availableTechnicians: number;
        activeJobs: number;
        completedToday: number;
        averagePerTech: number;
        technicians: Array<{
          name: string;
          completedToday: number;
        }>;
      };
    };
  };
}

interface CompletedRepairDetail {
  id: string;
  status: string;
  created_at: string;
  repair_jobs: Array<{
    id: string;
    repair_type: string;
    completed_at: string;
  }>;
}

export class DashboardService {
  constructor(private supabase: SupabaseClient) {}

  async getDashboardMetrics(dateRange?: { from: Date; to: Date }): Promise<DashboardMetrics> {
    try {
      // Get production metrics from the production_metrics table
      const productionMetrics = await this.getProductionMetrics(dateRange);
      
      // Get additional data that's not in production_metrics
      const [batchIntakeStats, technicianUtilization, finalQCCount, inRepairCount, awaitingRepairCount, completedRepairDetails] = await Promise.all([
        this.getBatchIntakeStats(dateRange),
        this.getTechnicianUtilization(),
        this.getFinalQCCount(),
        this.getInRepairCount(),
        this.getAwaitingRepairCount(),
        this.getCompletedRepairDetails(dateRange),
      ]);

      // Calculate completed repairs statistics from actual completed devices
      const completedRepairsStats = this.calculateCompletedRepairsStats(completedRepairDetails);

      const dashboardData = {
        batchIntakeStats: {
          batchesCreated: productionMetrics.batches_created, // Use from production_metrics
          expectedDevicesCount: batchIntakeStats.expectedDevicesCount, // Sum of device_count from batches
          importedDevicesCount: batchIntakeStats.importedDevicesCount, // Count of devices from devices table by created_at
        },
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
          initialGrades: {
            gradeA: productionMetrics.initial_grade_a_count,
            gradeB: productionMetrics.initial_grade_b_count,
            gradeC: productionMetrics.initial_grade_c_count,
          },
        },
        finalQCStats: {
          generalStats: {
            awaitingQC: finalQCCount, // Devices in final_qc status are awaiting QC processing
            failedQCCount: productionMetrics.fail_qc_count, // From production_metrics table
          },
          assignedGrades: {
            gradeA: productionMetrics.grade_a_count,
            gradeB: productionMetrics.grade_b_count,
            gradeC: productionMetrics.grade_c_count,
          },
        },
        devicesStats: {
          expectedDevices: batchIntakeStats.expectedDevicesCount,
          importedDevices: batchIntakeStats.importedDevicesCount, // Count of devices from devices table by created_at
          awaitingRepair: awaitingRepairCount, // Use the accurate count from database
          inRepair: inRepairCount, // Use the accurate count from database
          finalQC: finalQCCount, // Use the correct count from database
          graded: productionMetrics.devices_completed,
        },
        repairStats: {
          completedRepairs: completedRepairsStats, // Use real-time calculated stats
          technicianUtilization,
        },
        completedRepairDetails,
      };


      return dashboardData as unknown as DashboardMetrics;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  private async getProductionMetrics(dateRange?: { from: Date; to: Date }) {
    let query = this.supabase
      .from('production_metrics')
      .select(`
        id,
        metric_date,
        batches_created,
        devices_received,
        devices_in_repair,
        devices_completed,
        devices_shipped,
        housing_changes,
        glass_changes,
        battery_changes,
        software_updates,
        other_repairs,
        grade_a_count,
        grade_b_count,
        grade_c_count,
        fail_qc_count,
        initial_grade_a_count,
        initial_grade_b_count,
        initial_grade_c_count,
        created_at
      `)
      .order('metric_date', { ascending: false });

    if (dateRange) {
      // For production_metrics we can use date comparison since metric_date is DATE type
      const fromDate = dayjs(dateRange.from).format('YYYY-MM-DD');
      const toDate = dayjs(dateRange.to).format('YYYY-MM-DD');
      
      query = query.gte('metric_date', fromDate)
                   .lte('metric_date', toDate);
    }

    const { data: metrics, error } = await query;

    if (error) {
      console.error('Error getting production metrics:', error)
      throw error
    }

    if (!metrics || metrics.length === 0) {
      // Return default values if no metrics found
      return {
        batches_created: 0,
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
        fail_qc_count: 0,
        initial_grade_a_count: 0,
        initial_grade_b_count: 0,
        initial_grade_c_count: 0,
      };
    }

    // If date range is specified, sum all metrics in the range
    if (dateRange) {
      const summedMetrics = metrics.reduce((sum, metric) => ({
        batches_created: sum.batches_created + (metric.batches_created || 0),
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
        fail_qc_count: sum.fail_qc_count + (metric.fail_qc_count || 0),
        initial_grade_a_count: sum.initial_grade_a_count + (metric.initial_grade_a_count || 0),
        initial_grade_b_count: sum.initial_grade_b_count + (metric.initial_grade_b_count || 0),
        initial_grade_c_count: sum.initial_grade_c_count + (metric.initial_grade_c_count || 0),
      }), {
        batches_created: 0,
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
        fail_qc_count: 0,
        initial_grade_a_count: 0,
        initial_grade_b_count: 0,
        initial_grade_c_count: 0,
      });
      
      return summedMetrics
    }

    // If no date range, return the most recent metrics
    return metrics[0];
  }

  private async getBatchIntakeStats(dateRange?: { from: Date; to: Date }) {
    console.log('🔍 getBatchIntakeStats: Called with date range:', dateRange)
    
    let query = this.supabase
      .from('batches')
      .select('device_count, created_at')
      .is('deleted_at', null);

    if (dateRange) {
      // Use dayjs for reliable date handling
      const startOfDay = dayjs(dateRange.from).startOf('day').toDate();
      const endOfDay = dayjs(dateRange.to).endOf('day').toDate();
      
      console.log('🔍 getBatchIntakeStats: Date range details:', {
        from: dateRange.from,
        fromISO: dateRange.from.toISOString(),
        to: dateRange.to,
        toISO: dateRange.to.toISOString(),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString()
      })
      
      query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
    }

    const { data: batches, error } = await query;

    if (error) throw error;

    console.log('🔍 getBatchIntakeStats: Found batches:', batches?.length, 'for date range:', dateRange)

    const batchesCreated = batches?.length || 0;
    const expectedDevicesCount = batches?.reduce((sum, batch) => sum + (batch.device_count || 0), 0) || 0;

    // For imported devices, count devices from devices table by created_at in the selected date range
    let devicesQuery = this.supabase
      .from('devices')
      .select('id, created_at')
      .is('deleted_at', null);

    if (dateRange) {
      const startOfDay = dayjs(dateRange.from).startOf('day').toDate();
      const endOfDay = dayjs(dateRange.to).endOf('day').toDate();
      
      devicesQuery = devicesQuery.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
    }

    const { data: devices, error: devicesError } = await devicesQuery;
    
    if (devicesError) {
      console.error('❌ Error fetching devices for imported count:', devicesError);
      // Fallback to expectedDevicesCount if devices query fails
      const importedDevicesCount = expectedDevicesCount;
      
      console.log('📊 getBatchIntakeStats: Calculated stats (fallback):', {
        batchesCreated,
        expectedDevicesCount,
        importedDevicesCount,
        batches: batches?.map(b => ({ 
          device_count: b.device_count, 
          created_at: b.created_at 
        }))
      });

      return {
        batchesCreated,
        expectedDevicesCount,
        importedDevicesCount,
      };
    }

    const importedDevicesCount = devices?.length || 0;
    
    console.log('📊 getBatchIntakeStats: Calculated stats:', {
      batchesCreated,
      expectedDevicesCount,
      importedDevicesCount,
      batches: batches?.map(b => ({ 
        device_count: b.device_count, 
        created_at: b.created_at 
      })),
      devices: devices?.map(d => ({ 
        id: d.id, 
        created_at: d.created_at 
      }))
    });

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
        technicians: [],
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
    const today = dayjs().startOf('day').toDate();
    
    const { data: completedJobs, error: completedError } = await this.supabase
      .from('repair_jobs')
      .select('id, completed_at')
      .in('assigned_to', technicianIds)
      .eq('status', 'completed')
      .gte('completed_at', today.toISOString())
      .is('deleted_at', null);

    if (completedError) throw completedError;

    const completedToday = completedJobs?.length || 0;
    const averagePerTech = availableTechnicians > 0 ? Math.round(completedToday / availableTechnicians) : 0;

    const techniciansWithCompletedJobs = await this.getTechniciansWithCompletedJobs(level, technicianIds);

    return {
      availableTechnicians,
      activeJobs: activeJobsCount,
      completedToday,
      averagePerTech,
      technicians: techniciansWithCompletedJobs,
    };
  }

  private async getTechniciansWithCompletedJobs(
    level: 'L1' | 'L2' | 'L3',
    technicianIds: string[]
  ) {
    // Get technician names
    const { data: technicianProfiles, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', technicianIds);

    if (profileError) throw profileError;

    // Create a map of technician ID to name
    const technicianNames: { [key: string]: string } = {};
    technicianProfiles?.forEach(tech => {
      technicianNames[tech.id] = tech.full_name;
    });

    // Get completed jobs for today
    const { data: completedJobs, error: completedError } = await this.supabase
      .from('repair_jobs')
      .select('assigned_to, completed_at')
      .in('assigned_to', technicianIds)
      .eq('status', 'completed')
      .gte('completed_at', dayjs().startOf('day').toISOString())
      .is('deleted_at', null);

    if (completedError) throw completedError;

    // Count completed jobs per technician
    const technicianCompletedJobs: { [key: string]: number } = {};
    completedJobs?.forEach(job => {
      const technicianId = job.assigned_to;
      technicianCompletedJobs[technicianId] = (technicianCompletedJobs[technicianId] || 0) + 1;
    });

    // Return technicians with names and completed jobs
    const technicians = technicianIds.map(id => ({
      name: technicianNames[id] || 'Unknown',
      completedToday: technicianCompletedJobs[id] || 0,
    }));

    return technicians;
  }

  private async getFinalQCCount() {
    // Count devices that are in 'final_qc' status
    // These are devices where all repair jobs have been completed
    const { data: finalQCDevices, error: finalError } = await this.supabase
      .from('devices')
      .select('id')
      .eq('status', 'final_qc')
      .is('deleted_at', null);

    if (finalError) throw finalError;

    return finalQCDevices?.length || 0;
  }

  private async getInRepairCount() {
    // Count devices that have pending or in_progress repair jobs
    // These are devices currently being repaired
    const { data: inRepairDevices, error: inRepairError } = await this.supabase
      .from('repair_jobs')
      .select('device_id')
      .in('status', ['pending', 'in_progress'])
      .is('deleted_at', null);

    if (inRepairError) throw inRepairError;

    // Count unique devices (a device might have multiple repair jobs)
    const uniqueDeviceIds = new Set(inRepairDevices?.map(job => job.device_id) || []);
    return uniqueDeviceIds.size;
  }

  private async getAwaitingRepairCount() {
    // Count devices that are in 'awaiting_repair' status
    // These are devices that have completed initial QC and are waiting for repair to begin
    const { data: awaitingRepairDevices, error: awaitingRepairError } = await this.supabase
      .from('devices')
      .select('id')
      .eq('status', 'awaiting_repair')
      .is('deleted_at', null);

    if (awaitingRepairError) throw awaitingRepairError;

    return awaitingRepairDevices?.length || 0;
  }

  private async getCompletedRepairDetails(dateRange?: { from: Date; to: Date }) {
    let query = this.supabase
      .from('devices')
      .select('id, status, created_at, repair_jobs(id, repair_type, completed_at)')
      .eq('status', 'final_qc')
      .is('deleted_at', null);

    if (dateRange) {
      const startOfDay = dayjs(dateRange.from).startOf('day').toDate();
      const endOfDay = dayjs(dateRange.to).endOf('day').toDate();
      
      query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
    }

    const { data: completedDevices, error: devicesError } = await query;

    if (devicesError) {
      console.error('❌ Error fetching completed repair details:', devicesError);
      return [];
    }


    return completedDevices || [];
  }

  private calculateCompletedRepairsStats(completedRepairDetails: CompletedRepairDetail[]) {
    const stats = {
      housing: 0,
      glass: 0,
      battery: 0,
      software: 0,
      other: 0,
    };

    // Count repair types from completed devices
    completedRepairDetails.forEach(device => {
      device.repair_jobs.forEach((repair: { repair_type: string }) => {
        switch (repair.repair_type) {
          case 'housing_change':
            stats.housing++;
            break;
          case 'glass_change':
            stats.glass++;
            break;
          case 'battery_change':
            stats.battery++;
            break;
          case 'software_update':
            stats.software++;
            break;
          case 'other':
            stats.other++;
            break;
        }
      });
    });

    return stats;
  }
}
