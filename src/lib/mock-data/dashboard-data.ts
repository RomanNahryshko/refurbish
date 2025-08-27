// Mock data service for dashboard components
// All data is hardcoded for demonstration purposes

export interface DailyProductionMetrics {
  devicesReceived: number;
  devicesRepairedToday: number;
  devicesGradedToday: number;
  currentBacklog: number;
}

export interface RepairMetrics {
  housingChanges: number;
  glassChanges: number;
  batteryChanges: number;
  softwareUpdates: number;
  otherRepairs: number;
  pendingRepairs: number;
  inProgress: number;
  completedToday: number;
  failedRepairs: number;
}

export interface DevicesStats {
  expectedDevices: number;
  importedDevices: number;
  awaitingRepair: number;
  inRepair: number;
  finalQC: number;
  graded: number;
}

export interface TechnicianDetails {
  name: string;
  activeJobs: number;
  completedToday: number;
}

export interface TechnicianCapacity {
  level: 'L1' | 'L2' | 'L3';
  availableTechnicians: number;
  activeJobs: number;
  completedToday: number;
  averagePerTech: number;
  technicians: TechnicianDetails[];
}

export interface GradeDistribution {
  gradeA: number;
  gradeB: number;
  gradeC: number;
  ungraded: number;
}

export interface BatchIntakeStats {
  batchesCreated: number;
  expectedDevicesCount: number;
  importedDevicesCount: number;
}

export interface InitialQCStats {
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
}

export interface TechnicianStats {
  name: string;
  jobsCompleted: number;
}

export interface FinalQCStats {
  generalStats: {
    awaitingQC: number;
    failedQCCount: number;
  };
  assignedGrades: {
    gradeA: number;
    gradeB: number;
    gradeC: number;
  };
}

export interface RepairStats {
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
    techniciansList: TechnicianStats[];
  };
}

export interface BatchStatus {
  batchNumber: string;
  received: string;
  deviceCount: number;
  status: string;
}

export interface QCQueueItem {
  internalId: string;
  imei: string;
  model: string;
  timeInQueue: string;
}

export interface TechnicianJob {
  internalId: string;
  model: string;
  repairType: string;
  waitTime: string;
}

export interface ActiveJob {
  internalId: string;
  imei: string;
  model: string;
  repairType: string;
  startedAgo: string;
}

// Mock data for Admin/General Manager Dashboard
export const mockDailyProductionMetrics: DailyProductionMetrics = {
  devicesReceived: 87,
  devicesRepairedToday: 142,
  devicesGradedToday: 95,
  currentBacklog: 234,
};

export const mockRepairMetrics: RepairMetrics = {
  housingChanges: 45,
  glassChanges: 32,
  batteryChanges: 28,
  softwareUpdates: 37,
  otherRepairs: 15,
  pendingRepairs: 89,
  inProgress: 23,
  completedToday: 142,
  failedRepairs: 5,
};

export const mockDevicesStats: DevicesStats = {
  expectedDevices: 850,
  importedDevices: 800,
  awaitingRepair: 234,
  inRepair: 23,
  finalQC: 67,
  graded: 356,
};

export const mockTechnicianCapacity: TechnicianCapacity[] = [
  { 
    level: 'L1', 
    availableTechnicians: 5, 
    activeJobs: 8, 
    completedToday: 45, 
    averagePerTech: 9.0,
    technicians: [
      { name: "Ahmed Al-Mansouri", activeJobs: 2, completedToday: 12 },
      { name: "Muhammad Hassan", activeJobs: 1, completedToday: 8 },
      { name: "Ali Khan", activeJobs: 2, completedToday: 10 },
      { name: "Zain Ahmad", activeJobs: 1, completedToday: 7 },
      { name: "Omar Al-Rashid", activeJobs: 2, completedToday: 8 },
    ]
  },
  { 
    level: 'L2', 
    availableTechnicians: 3, 
    activeJobs: 5, 
    completedToday: 32, 
    averagePerTech: 10.7,
    technicians: [
      { name: "Fatima Al-Zahra", activeJobs: 2, completedToday: 15 },
      { name: "Ayesha Malik", activeJobs: 2, completedToday: 11 },
      { name: "Mariam Al-Hashemi", activeJobs: 1, completedToday: 6 },
    ]
  },
  { 
    level: 'L3', 
    availableTechnicians: 4, 
    activeJobs: 10, 
    completedToday: 28, 
    averagePerTech: 7.0,
    technicians: [
      { name: "Hassan Al-Farooq", activeJobs: 3, completedToday: 9 },
      { name: "Saeed Al-Maktoum", activeJobs: 2, completedToday: 7 },
      { name: "Nadia Sheikh", activeJobs: 3, completedToday: 8 },
      { name: "Khalid Al-Zaabi", activeJobs: 2, completedToday: 4 },
    ]
  },
];

export const mockGradeDistribution: GradeDistribution = {
  gradeA: 25,
  gradeB: 40,
  gradeC: 30,
  ungraded: 5,
};

export const mockBatchIntakeStats: BatchIntakeStats = {
  batchesCreated: 12,
  expectedDevicesCount: 487,
  importedDevicesCount: 463,
};

export const mockInitialQCStats: InitialQCStats = {
  assignedRepairs: {
    housing: 34,
    glass: 28,
    battery: 21,
    software: 15,
    other: 8,
  },
  assignedGrades: {
    gradeA: 42,
    gradeB: 38,
    gradeC: 26,
  },
};

export const mockFinalQCStats: FinalQCStats = {
  generalStats: {
    awaitingQC: 67,
    failedQCCount: 8,
  },
  assignedGrades: {
    gradeA: 35,
    gradeB: 42,
    gradeC: 18,
  },
};

export const mockRepairStats: RepairStats = {
  completedRepairs: {
    housing: 28,
    glass: 24,
    battery: 19,
    software: 32,
    other: 6,
  },
  technicianUtilization: {
    activeTechnicians: 8,
    avgJobsPerTech: 13.6,
    techniciansList: [
      { name: "Ahmed Al-Mansouri", jobsCompleted: 18 },
      { name: "Muhammad Hassan", jobsCompleted: 16 },
      { name: "Fatima Al-Zahra", jobsCompleted: 15 },
      { name: "Ali Khan", jobsCompleted: 14 },
      { name: "Omar Al-Rashid", jobsCompleted: 12 },
      { name: "Ayesha Malik", jobsCompleted: 11 },
      { name: "Zain Ahmad", jobsCompleted: 9 },
      { name: "Mariam Al-Hashemi", jobsCompleted: 8 },
    ],
  },
};

// Mock data for Operations Manager Dashboard
export const mockOpsManagerMetrics = {
  newBatches: 3,
  devicesAdded: 87,
  repairsCreated: 156,
  repairsAssigned: 143,
};

export const mockBatchStatus: BatchStatus[] = [
  { batchNumber: 'BATCH-20240315-001', received: 'Today', deviceCount: 35, status: 'Processing' },
  { batchNumber: 'BATCH-20240315-002', received: 'Today', deviceCount: 28, status: 'Processing' },
  { batchNumber: 'BATCH-20240315-003', received: 'Today', deviceCount: 24, status: 'Received' },
  { batchNumber: 'BATCH-20240314-001', received: 'Yesterday', deviceCount: 45, status: 'Complete' },
  { batchNumber: 'BATCH-20240314-002', received: 'Yesterday', deviceCount: 52, status: 'Complete' },
];

export const mockRepairQueueOverview = {
  housingRepairsPending: 34,
  glassRepairsPending: 28,
  batteryRepairsPending: 21,
  otherRepairsPending: 6,
};

// Mock data for Quality Control Dashboard
export const mockQCWorkload = {
  awaitingFinalQC: 67,
  qcCompletedToday: 95,
  devicesGraded: 95,
  failedQC: 8,
};

export const mockTodayGradeDistribution = {
  gradeA: { count: 25, percentage: 26 },
  gradeB: { count: 40, percentage: 42 },
  gradeC: { count: 30, percentage: 32 },
};

export const mockQCQueue: QCQueueItem[] = [
  { internalId: '00001234', imei: '356938035643809', model: 'iPhone 11', timeInQueue: '2h 15m' },
  { internalId: '00001235', imei: '356938035643810', model: 'iPhone 12', timeInQueue: '1h 45m' },
  { internalId: '00001236', imei: '356938035643811', model: 'iPhone 11 Pro', timeInQueue: '1h 30m' },
  { internalId: '00001237', imei: '356938035643812', model: 'iPhone 13', timeInQueue: '45m' },
  { internalId: '00001238', imei: '356938035643813', model: 'iPhone 12 Pro', timeInQueue: '30m' },
];

// Mock data for Technician Dashboard
export const mockTechnicianWorkToday = {
  jobsCompleted: 8,
  currentActiveJob: 1,
  availableInQueue: 12,
};

export const mockAvailableRepairs: TechnicianJob[] = [
  { internalId: '00001240', model: 'iPhone 11', repairType: 'Housing Change', waitTime: '3h' },
  { internalId: '00001241', model: 'iPhone 12', repairType: 'Housing Change', waitTime: '2h 30m' },
  { internalId: '00001242', model: 'iPhone 11 Pro', repairType: 'Housing Change', waitTime: '2h' },
  { internalId: '00001243', model: 'iPhone 13', repairType: 'Housing Change', waitTime: '1h 45m' },
];

export const mockActiveJob: ActiveJob = {
  internalId: '00001239',
  imei: '356938035643808',
  model: 'iPhone 12 Pro',
  repairType: 'Housing Change',
  startedAgo: '45 minutes ago',
};

// Helper function to get devices stats with percentages
export const getDevicesStatsWithPercentages = (devicesData: DevicesStats) => {
  const total = Object.values(devicesData).reduce((sum, count) => sum + count, 0);
  
  return [
    { status: 'Expected Devices', count: devicesData.expectedDevices, percentage: Math.round((devicesData.expectedDevices / total) * 100), color: '#8B5CF6' },
    { status: 'Imported Devices', count: devicesData.importedDevices, percentage: Math.round((devicesData.importedDevices / total) * 100), color: '#06B6D4' },
    { status: 'Awaiting Repair', count: devicesData.awaitingRepair, percentage: Math.round((devicesData.awaitingRepair / total) * 100), color: '#F59E0B' },
    { status: 'In Repair', count: devicesData.inRepair, percentage: Math.round((devicesData.inRepair / total) * 100), color: '#EF4444' },
    { status: 'Final QC', count: devicesData.finalQC, percentage: Math.round((devicesData.finalQC / total) * 100), color: '#10B981' },
    { status: 'Graded', count: devicesData.graded, percentage: Math.round((devicesData.graded / total) * 100), color: '#3B82F6' },
  ];
};

// Function to simulate date variations (for future use with date picker)
export const getMockDataForDate = (date: string) => {
  // For MVP, we'll return the same data regardless of date
  // In real implementation, this would vary based on the selected date
  return {
    dailyProductionMetrics: mockDailyProductionMetrics,
    repairMetrics: mockRepairMetrics,
    devicesStats: mockDevicesStats,
    technicianCapacity: mockTechnicianCapacity,
    gradeDistribution: mockGradeDistribution,
    batchIntakeStats: mockBatchIntakeStats,
    initialQCStats: mockInitialQCStats,
    finalQCStats: mockFinalQCStats,
    repairStats: mockRepairStats,
    opsManagerMetrics: mockOpsManagerMetrics,
    batchStatus: mockBatchStatus,
    repairQueueOverview: mockRepairQueueOverview,
    qcWorkload: mockQCWorkload,
    todayGradeDistribution: mockTodayGradeDistribution,
    qcQueue: mockQCQueue,
    technicianWorkToday: mockTechnicianWorkToday,
    availableRepairs: mockAvailableRepairs,
    activeJob: mockActiveJob,
  };
};

// Function to get mock data for a date range
export const getMockDataForDateRange = (dateRange: { from?: Date; to?: Date } | undefined) => {
  // For MVP, we'll return aggregated data based on the range
  // In real implementation, this would query the database with the date range
  
  if (!dateRange || !dateRange.from) {
    // If no range selected, return today's data
    return getMockDataForDate(new Date().toISOString());
  }
  
  // Calculate the number of days in the range
  const startDate = dateRange.from;
  const endDate = dateRange.to || dateRange.from;
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // For demo purposes, multiply some metrics by the number of days
  // In real implementation, this would be actual aggregated data from the database
  return {
    dailyProductionMetrics: {
      ...mockDailyProductionMetrics,
      devicesReceived: mockDailyProductionMetrics.devicesReceived * daysDiff,
      devicesRepaired: mockDailyProductionMetrics.devicesRepaired * daysDiff,
      devicesGraded: mockDailyProductionMetrics.devicesGraded * daysDiff,
    },
    repairMetrics: {
      ...mockRepairMetrics,
      housingChanges: mockRepairMetrics.housingChanges * daysDiff,
      glassChanges: mockRepairMetrics.glassChanges * daysDiff,
      batteryChanges: mockRepairMetrics.batteryChanges * daysDiff,
      softwareUpdates: mockRepairMetrics.softwareUpdates * daysDiff,
      otherRepairs: mockRepairMetrics.otherRepairs * daysDiff,
      completedToday: mockRepairMetrics.completedToday * daysDiff,
    },
    devicesStats: mockDevicesStats,
    technicianCapacity: mockTechnicianCapacity,
    gradeDistribution: mockGradeDistribution,
    batchIntakeStats: {
      ...mockBatchIntakeStats,
      batchesCreated: Math.ceil(mockBatchIntakeStats.batchesCreated * daysDiff / 7), // Assume weekly batches
      expectedDevicesCount: mockBatchIntakeStats.expectedDevicesCount * daysDiff,
      importedDevicesCount: mockBatchIntakeStats.importedDevicesCount * daysDiff,
    },
    initialQCStats: {
      assignedRepairs: {
        housing: mockInitialQCStats.assignedRepairs.housing * daysDiff,
        glass: mockInitialQCStats.assignedRepairs.glass * daysDiff,
        battery: mockInitialQCStats.assignedRepairs.battery * daysDiff,
        software: mockInitialQCStats.assignedRepairs.software * daysDiff,
        other: mockInitialQCStats.assignedRepairs.other * daysDiff,
      },
      assignedGrades: {
        gradeA: mockInitialQCStats.assignedGrades.gradeA * daysDiff,
        gradeB: mockInitialQCStats.assignedGrades.gradeB * daysDiff,
        gradeC: mockInitialQCStats.assignedGrades.gradeC * daysDiff,
      },
    },
    finalQCStats: {
      generalStats: {
        awaitingQC: mockFinalQCStats.generalStats.awaitingQC, // Current status, not multiplied
        failedQCCount: mockFinalQCStats.generalStats.failedQCCount * daysDiff,
      },
      assignedGrades: {
        gradeA: mockFinalQCStats.assignedGrades.gradeA * daysDiff,
        gradeB: mockFinalQCStats.assignedGrades.gradeB * daysDiff,
        gradeC: mockFinalQCStats.assignedGrades.gradeC * daysDiff,
      },
    },
    repairStats: {
      completedRepairs: {
        housing: mockRepairStats.completedRepairs.housing * daysDiff,
        glass: mockRepairStats.completedRepairs.glass * daysDiff,
        battery: mockRepairStats.completedRepairs.battery * daysDiff,
        software: mockRepairStats.completedRepairs.software * daysDiff,
        other: mockRepairStats.completedRepairs.other * daysDiff,
      },
      technicianUtilization: mockRepairStats.technicianUtilization,
    },
    opsManagerMetrics: mockOpsManagerMetrics,
    batchStatus: mockBatchStatus,
    repairQueueOverview: mockRepairQueueOverview,
    qcWorkload: mockQCWorkload,
    todayGradeDistribution: mockTodayGradeDistribution,
    qcQueue: mockQCQueue,
    technicianWorkToday: mockTechnicianWorkToday,
    availableRepairs: mockAvailableRepairs,
    activeJob: mockActiveJob,
  };
};
