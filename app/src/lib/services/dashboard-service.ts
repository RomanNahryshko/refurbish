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
      L1: TechnicianLevelStats;
      L2: TechnicianLevelStats;
      L3: TechnicianLevelStats;
    };
  };
}

interface TechnicianLevelStats {
  availableTechnicians: number;
  activeJobs: number;
  completedToday: number;
  averagePerTech: number;
  technicians: Array<{ id: string; name: string; completedToday: number }>;
}

const DEFAULT_PRODUCTION_METRICS = {
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

function normalizeDateRange(dateRange?: { from: Date; to: Date }) {
  if (!dateRange) return undefined;
  return {
    metricFrom: dayjs(dateRange.from).format('YYYY-MM-DD'),
    metricTo: dayjs(dateRange.to).format('YYYY-MM-DD'),
    startISO: dayjs(dateRange.from).startOf('day').toISOString(),
    endISO: dayjs(dateRange.to).endOf('day').toISOString(),
  };
}

export class DashboardService {
  constructor(private supabase: SupabaseClient) {}

  async getDashboardMetrics(dateRange?: { from: Date; to: Date }): Promise<DashboardMetrics> {
    try {
      const [
        productionMetrics,
        batchIntake,
        technicianUtilization,
        finalQCCount,
        inRepairCount,
        awaitingRepairCount,
        completedRepairsStats,
      ] = await Promise.all([
        this.getProductionMetrics(dateRange),
        this.getBatchIntakeStats(dateRange),
        this.getTechnicianUtilization(dateRange),
        this.getFinalQCCount(dateRange),
        this.getInRepairCount(dateRange),
        this.getAwaitingRepairCount(dateRange),
        this.getCompletedRepairsStats(dateRange),
      ]);

      return {
        batchIntakeStats: {
          batchesCreated: batchIntake.batchesCreated,
          expectedDevicesCount: batchIntake.expectedDevicesCount,
          importedDevicesCount: batchIntake.importedDevicesCount,
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
            awaitingQC: finalQCCount,
            failedQCCount: productionMetrics.fail_qc_count,
          },
          assignedGrades: {
            gradeA: productionMetrics.grade_a_count,
            gradeB: productionMetrics.grade_b_count,
            gradeC: productionMetrics.grade_c_count,
          },
        },
        devicesStats: {
          expectedDevices: batchIntake.expectedDevicesCount,
          importedDevices: batchIntake.importedDevicesCount,
          awaitingRepair: awaitingRepairCount,
          inRepair: inRepairCount,
          finalQC: finalQCCount,
          graded: productionMetrics.devices_completed,
        },
        repairStats: {
          completedRepairs: completedRepairsStats,
          technicianUtilization,
        },
      };
    } catch (err) {
      console.error('Error in getDashboardMetrics:', err);
      throw err;
    }
  }

  private async getProductionMetrics(dateRange?: { from: Date; to: Date }) {
    const fields = [
      'batches_created',
      'devices_received',
      'devices_in_repair',
      'devices_completed',
      'devices_shipped',
      'housing_changes',
      'glass_changes',
      'battery_changes',
      'software_updates',
      'other_repairs',
      'grade_a_count',
      'grade_b_count',
      'grade_c_count',
      'fail_qc_count',
      'initial_grade_a_count',
      'initial_grade_b_count',
      'initial_grade_c_count',
    ];
    const range = normalizeDateRange(dateRange);
    let query = this.supabase
      .from('production_metrics')
      .select(fields.join(','))
      .order('metric_date', { ascending: false });
    if (range) query = query.gte('metric_date', range.metricFrom).lte('metric_date', range.metricTo);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return { ...DEFAULT_PRODUCTION_METRICS };
    if (range) {
      const summed = { ...DEFAULT_PRODUCTION_METRICS };
      for (const row of data) {
        for (const key of Object.keys(summed) as (keyof typeof summed)[]) {
          summed[key] = Number((summed as any)[key] || 0) + Number((row as any)[key] || 0);
        }
      }
      return summed;
    }
    const latest = data[0];
    const normalized: any = {};
    for (const k of fields) normalized[k] = Number((latest as any)[k] || 0);
    return normalized;
  }

  private async getBatchIntakeStats(dateRange?: { from: Date; to: Date }) {
    const range = normalizeDateRange(dateRange);
    const batchQuery = this.supabase
      .from('batches')
      .select('device_count, created_at')
      .is('deleted_at', null)
      .range(0, 999999);
    if (range) batchQuery.gte('created_at', range.startISO).lte('created_at', range.endISO);

    const deviceCountQuery = this.supabase
      .from('devices')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);
    if (range) deviceCountQuery.gte('created_at', range.startISO).lte('created_at', range.endISO);

    const [{ data: batches, error: bErr }, { count: importedCount, error: dErr }] = await Promise.all([
      batchQuery,
      deviceCountQuery,
    ]);
    if (bErr) throw bErr;
    if (dErr) throw dErr;

    return {
      batchesCreated: batches?.length || 0,
      expectedDevicesCount:
        batches?.reduce((sum: number, b: { device_count?: number }) => sum + Number(b.device_count || 0), 0) || 0,
      importedDevicesCount: Number(importedCount || 0),
    };
  }

  private async getTechnicianUtilization(dateRange?: { from: Date; to: Date }) {
    const { data: technicians, error: techErr } = await this.supabase
      .from('user_profiles')
      .select('id, full_name, technician_level')
      .eq('role', 'technician')
      .is('deleted_at', null);
    if (techErr) throw techErr;

    const techs = technicians || [];
    const technicianIds = techs.map((t: any) => t.id).filter(Boolean);

    const grouped: Record<'L1' | 'L2' | 'L3', TechnicianLevelStats> = {
      L1: { availableTechnicians: 0, activeJobs: 0, completedToday: 0, averagePerTech: 0, technicians: [] },
      L2: { availableTechnicians: 0, activeJobs: 0, completedToday: 0, averagePerTech: 0, technicians: [] },
      L3: { availableTechnicians: 0, activeJobs: 0, completedToday: 0, averagePerTech: 0, technicians: [] },
    };

    if (technicianIds.length === 0) return grouped;

    const range = normalizeDateRange(dateRange);

    // Активные работы (без фильтра по дате)
    const activeJobsPromise = this.supabase
      .from('repair_jobs')
      .select('id, status, assigned_to')
      .in('assigned_to', technicianIds)
      .in('status', ['pending', 'in_progress'])
      .is('deleted_at', null);

    // Completed jobs within selected period (or today by default)
    let completedJobsQuery = this.supabase
      .from('repair_jobs')
      .select('id, status, assigned_to, completed_at')
      .in('assigned_to', technicianIds)
      .eq('status', 'completed')
      .is('deleted_at', null);

    if (range) {
      completedJobsQuery = completedJobsQuery
        .gte('completed_at', range.startISO)
        .lte('completed_at', range.endISO);
    } else {
      const startOfTodayISO = dayjs().startOf('day').toISOString();
      const endOfTodayISO = dayjs().endOf('day').toISOString();
      completedJobsQuery = completedJobsQuery
        .gte('completed_at', startOfTodayISO)
        .lte('completed_at', endOfTodayISO);
    }

    const [{ data: activeJobs, error: activeErr }, { data: completedJobs, error: completedErr }] =
      await Promise.all([activeJobsPromise, completedJobsQuery]);

    if (activeErr) throw activeErr;
    if (completedErr) throw completedErr;
    // quick access to profiles
    const profilesById: Record<string, { full_name?: string; technician_level?: string }> = {};
    for (const t of techs) {
      profilesById[t.id] = { full_name: t.full_name, technician_level: t.technician_level };
    }

    // add all technicians to the list (completedToday = 0)
    for (const t of techs) {
      const level: 'L1' | 'L2' | 'L3' = t.technician_level as any || 'L1';
      grouped[level].technicians.push({
        id: t.id,
        name: t.full_name || 'Unknown',
        completedToday: 0,
      });
    }

    // count active jobs
    for (const job of activeJobs || []) {
      const techId = (job as any).assigned_to;
      const profile = profilesById[techId];
      if (!profile) continue;
      const level: 'L1' | 'L2' | 'L3' = profile.technician_level as any || 'L1';
      grouped[level].activeJobs++;
    }

    // count completed jobs
    for (const job of completedJobs || []) {
      const techId = (job as any).assigned_to;
      const profile = profilesById[techId];
      if (!profile) continue;
      const level: 'L1' | 'L2' | 'L3' = profile.technician_level as any || 'L1';
      const group = grouped[level];
      group.completedToday++;
      const found = group.technicians.find(t => t.id === techId);
      if (found) found.completedToday++;
    }

    // filter: keep only technicians who actually worked in the period
    (['L1', 'L2', 'L3'] as const).forEach(level => {
      const g = grouped[level];
      g.technicians = g.technicians.filter(t => t.completedToday > 0);
      g.availableTechnicians = g.technicians.length;
      g.averagePerTech = g.availableTechnicians > 0 ? Math.round(g.completedToday / g.availableTechnicians) : 0;
    });

    return grouped;
  }

  private async getFinalQCCount(dateRange?: { from: Date; to: Date }) {
    const range = normalizeDateRange(dateRange);
    let query = this.supabase.from('devices').select('id', { count: 'exact', head: true }).eq('status', 'final_qc').is('deleted_at', null);
    if (range) query = query.gte('updated_at', range.startISO).lte('updated_at', range.endISO);
    const res = await query;
    if (res.error) throw res.error;
    return Number(res.count || 0);
  }

  private async getInRepairCount(dateRange?: { from: Date; to: Date }) {
    const range = normalizeDateRange(dateRange);
    let query = this.supabase
      .from('repair_jobs')
      .select('device_id')
      .in('status', ['in_progress'])
      .is('deleted_at', null);
    if (range) query = query.gte('updated_at', range.startISO).lte('updated_at', range.endISO);
    const { data, error } = await query;
    if (error) throw error;
    return data ? new Set(data.map((r: any) => r.device_id)).size : 0;
  }

  private async getAwaitingRepairCount(dateRange?: { from: Date; to: Date }) {
    const range = normalizeDateRange(dateRange);
    let query = this.supabase.from('devices').select('id', { count: 'exact', head: true }).eq('status', 'awaiting_repair').is('deleted_at', null);
    if (range) query = query.gte('updated_at', range.startISO).lte('updated_at', range.endISO);
    const res = await query;
    if (res.error) throw res.error;
    return Number(res.count || 0);
  }

  private async getCompletedRepairsStats(dateRange?: { from: Date; to: Date }) {
    const range = normalizeDateRange(dateRange);
    let query = this.supabase.from('repair_jobs').select('repair_type, completed_at').eq('status', 'completed').is('deleted_at', null);
    if (range) query = query.gte('completed_at', range.startISO).lte('completed_at', range.endISO);
    const { data, error } = await query;
    if (error) throw error;
    const stats = { housing: 0, glass: 0, battery: 0, software: 0, other: 0 };
    (data || []).forEach((r: any) => {
      switch (r.repair_type) {
        case 'housing_change': stats.housing++; break;
        case 'glass_change': stats.glass++; break;
        case 'battery_change': stats.battery++; break;
        case 'software_update': stats.software++; break;
        case 'other':
        default: stats.other++; break;
      }
    });
    return stats;
  }
}

