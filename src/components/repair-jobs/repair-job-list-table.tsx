'use client'

import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Eye,
    ClipboardCheck,
    CheckCircle,
    Clock,
    Wrench,
    Package,
    AlertCircle
} from 'lucide-react'
import { DeviceListTable, DeviceTableColumn } from '@/components/common/device-list-table'
import { RepairJob, Batch, Device } from '@/types/mock-types'
import Link from 'next/link'

// Repair status configuration for badges
export const repairStatusConfig = {
  'pending': { variant: 'outline' as const, icon: Clock, label: 'Pending' },
  'in_progress': { variant: 'secondary' as const, icon: Wrench, label: 'In Progress' },
  'completed': { variant: 'default' as const, icon: CheckCircle, label: 'Completed' }
}

// Repair type configuration
export const repairTypeConfig = {
  'housing_change': { label: 'Housing Change', level: 'L1', icon: Package },
  'glass_change': { label: 'Glass Change', level: 'L2', icon: AlertCircle },
  'battery_change': { label: 'Battery Change', level: 'L3', icon: Package },
  'software_update': { label: 'Software Update', level: 'Any', icon: CheckCircle },
  'other': { label: 'Other Repair', level: 'Any', icon: Wrench }
}

interface RepairJobListTableProps {
  repairJobs: RepairJob[]
  allRepairJobs?: RepairJob[] // Full list for counting repairs per device
  batches: Batch[]
  currentPage: number
  totalPages: number
  totalResults: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  renderFilters: () => ReactNode
  currentUser: {
    id: string
    full_name: string
    role: string
    technician_level: string | null
  }
  onStartRepair: (repair: RepairJob) => void
  onCompleteRepair: (repairId: string) => void
  onCancelRepair: (repairId: string) => void
}

// Convert RepairJob to Device-like structure for table compatibility
const convertRepairJobToDevice = (repairJob: RepairJob): Device & { _repairJobData: RepairJob } => ({
  id: repairJob.id,
  internal_id: repairJob.device_internal_id || 'N/A',
  model: repairJob.device_model || 'Unknown',
  repair_type: repairJob.repair_type,
  status: repairJob.status as any, // Allow repair status to be used
  assigned_to_name: repairJob.assigned_to_name,
  assigned_to: repairJob.assigned_to,
  created_at: repairJob.created_at,
  batch_id: repairJob.device_id, // Use device_id as batch reference
  // Required fields for Device interface compatibility
  imei: '', 
  serial_number: '',
  brand: '',
  grade: null,
  updated_at: repairJob.updated_at,
  // Add repair-specific data
  _repairJobData: repairJob
})

export function RepairJobListTable({
  repairJobs,
  allRepairJobs = repairJobs,
  batches,
  currentPage,
  totalPages,
  totalResults,
  itemsPerPage,
  onPageChange,
  renderFilters,
  currentUser,
  onStartRepair,
  onCompleteRepair,
  onCancelRepair
}: RepairJobListTableProps) {
  
  // Count repairs per device for badges
  const repairCountByDevice = allRepairJobs.reduce((acc, repair) => {
    const deviceId = repair.device_internal_id
    if (deviceId) {
      acc[deviceId] = (acc[deviceId] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Convert repair jobs to device-like format
  const deviceLikeData = repairJobs.map(convertRepairJobToDevice)
  
  // Track previous device ID for visual grouping
  let previousDeviceId: string | undefined = undefined
  
  // Define columns specific to repair jobs (MVP scope only)
  const columns: DeviceTableColumn[] = [
    'internal_id',
    'device',      // Device model
    'imei',        // Repair type (using imei column)
    'status',
    'grade',       // Created date (using grade column)
    'actions'
  ]

  const renderActions = (device: Device & { _repairJobData: RepairJob }) => {
    const repairJob = device._repairJobData
    const repairConfig = repairTypeConfig[repairJob.repair_type as keyof typeof repairTypeConfig]
    
    const canStartRepair = currentUser.role === 'ops_manager' || 
      (currentUser.technician_level && 
        (repairConfig?.level === currentUser.technician_level || repairConfig?.level === 'Any'))
    
    // Check if user already has an active repair
    const hasActiveRepair = repairJobs.some(r => 
      r.assigned_to === currentUser.id && r.status === 'in_progress'
    )

    return (
      <div className="flex items-center gap-2">
        <Link href={`/devices/${repairJob.device_internal_id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View Device
          </Button>
        </Link>
        
        {repairJob.status === 'pending' && canStartRepair && (
          <Button 
            size="sm"
            onClick={() => onStartRepair(repairJob)}
            disabled={hasActiveRepair}
            title={hasActiveRepair ? "Complete or cancel current repair first" : "Start this repair"}
          >
            <ClipboardCheck className="h-4 w-4 mr-1" />
            Start Repair
          </Button>
        )}
        
        {repairJob.status === 'in_progress' && repairJob.assigned_to === currentUser.id && (
          <>
            <Button 
              size="sm"
              onClick={() => onCompleteRepair(repairJob.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete
            </Button>
            <Button 
              size="sm"
              variant="ghost"
              onClick={() => onCancelRepair(repairJob.id)}
              className="text-gray-500 hover:text-gray-700 text-xs px-2"
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    )
  }

  // Custom cell renderer to override specific columns
  const renderCell = (device: Device & { _repairJobData: RepairJob }, column: DeviceTableColumn) => {
    const repairJob = device._repairJobData
    const repairConfig = repairTypeConfig[repairJob.repair_type as keyof typeof repairTypeConfig]
    const statusInfo = repairStatusConfig[repairJob.status as keyof typeof repairStatusConfig]
    
    switch (column) {
      case 'internal_id':
        return (
          <div className="font-medium">{device.internal_id}</div>
        )
      
      case 'device':
        // Show device model with repair count badge
        const totalRepairs = repairCountByDevice[repairJob.device_internal_id || ''] || 1
        const currentRepairIndex = allRepairJobs
          .filter(r => r.device_internal_id === repairJob.device_internal_id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .findIndex(r => r.id === repairJob.id) + 1
        
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{device.model}</span>
            {totalRepairs > 1 && (
              <Badge variant="secondary" className="text-xs">
                {currentRepairIndex} of {totalRepairs}
              </Badge>
            )}
          </div>
        )
      
      case 'imei':
        // Use imei column to show repair type
        const RepairIcon = repairConfig?.icon || Wrench
        return (
          <div className="flex items-center gap-2">
            <RepairIcon className="h-4 w-4 text-gray-600" />
            <span>{repairConfig?.label}</span>
            <Badge variant="outline" className="text-xs">
              {repairConfig?.level}
            </Badge>
          </div>
        )
      

      
      case 'status':
        const StatusIcon = statusInfo?.icon || Clock
        return (
          <Badge variant={statusInfo?.variant}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo?.label}
          </Badge>
        )
      
      case 'grade':
        // Use grade column to show created date
        return (
          <div className="text-sm text-gray-600">
            {new Date(repairJob.created_at).toISOString().split('T')[0]}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <DeviceListTable
      devices={deviceLikeData}
      batches={batches}
      columns={columns}
      renderActions={renderActions}
      currentPage={currentPage}
      totalPages={totalPages}
      totalResults={totalResults}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      title={`Repair Queue (${totalResults} jobs)`}
      renderFilters={renderFilters}
      pageKey="repair-jobs"
      renderCell={renderCell}
      customHeaders={{
        'internal_id': 'Internal ID',
        'device': 'Device',
        'imei': 'Repair Type',  // Custom header
        'status': 'Status',
        'grade': 'Created',     // Custom header
        'actions': 'Actions'
      }}
    />
  )
}
