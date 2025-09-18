'use client'

import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
import { RepairJob, Batch, Device } from '@/lib/types/business-types'
import Link from 'next/link'
import { canTechnicianPerformRepair } from '@/lib/config/permissions'

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
  'software_update': { label: 'Software Update', level: 'L3', icon: CheckCircle },
  'other': { 
    label: 'Other Repair', 
    level: 'L3', 
    icon: Wrench
  }
}

// Extended RepairJob type with joined data from API
interface RepairJobWithDevice extends RepairJob {
  device_internal_id?: string
  device_model?: string
  assigned_to_name?: string
}

interface RepairJobListTableProps {
  repairJobs: RepairJobWithDevice[]
  allRepairJobs?: RepairJobWithDevice[] // Full list for counting repairs per device
  batches: Batch[]
  currentPage: number
  totalPages: number
  totalResults: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  renderFilters: () => ReactNode
  currentUser?: {
    id: string
    full_name: string
    role: string
    technician_level: string | null
  }
  onStartRepair: (repair: RepairJobWithDevice) => void
  onCompleteRepair: (repair: RepairJobWithDevice) => void
  onCancelRepair: (repairId: string) => void
  repairCountByDevice?: Record<string, number> // Count of repairs per device
  isStartingRepair?: boolean | ((repairId: string) => boolean) // Loading state for start repair action
}

// Convert RepairJob to Device-like structure for table compatibility
const convertRepairJobToDevice = (repairJob: RepairJobWithDevice, allRepairJobs: RepairJobWithDevice[], repairCountByDevice?: Record<string, number>): Device & { _repairJobData: RepairJobWithDevice; _repairPosition: number; _totalRepairs: number } => {
  const deviceId = repairJob.device_internal_id || 'unknown'
  const totalRepairs = repairCountByDevice?.[deviceId] || 1
  
  // Find position of this repair job among repairs for the same device
  const deviceRepairs = allRepairJobs.filter(r => r.device_internal_id === deviceId)
  const repairPosition = deviceRepairs.findIndex(r => r.id === repairJob.id) + 1
  
  return {
    id: repairJob.id,
    internal_id: repairJob.device_internal_id || 'N/A',
    model: repairJob.device_model || 'Unknown',
    status: repairJob.status as Device['status'], // Cast to Device status type
    created_at: repairJob.created_at,
    batch_id: repairJob.device_id, // Use device_id as batch reference
    // Required fields for Device interface compatibility
    imei: '', 
    serial_number: '',
    brand: '',
    grade: 'ungraded',
    updated_at: repairJob.updated_at,
    // Add repair-specific data
    _repairJobData: repairJob,
    // Add repair position info
    _repairPosition: repairPosition,
    _totalRepairs: totalRepairs
  }
}

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
  onCancelRepair,
  repairCountByDevice,
  isStartingRepair
}: RepairJobListTableProps) {
  
  // Convert repair jobs to device-like format
  // Each repair job should be displayed as a separate row
  const deviceLikeData = repairJobs.map(repair => convertRepairJobToDevice(repair, allRepairJobs, repairCountByDevice))
  
  // Define columns specific to repair jobs (MVP scope only)
  const columns: DeviceTableColumn[] = [
    'internal_id',
    'device',      // Device model
    'imei',        // Repair type (using imei column)
    'status',
    'grade',       // Created date (using grade column)
    'actions'
  ]
  
  // Create a type for our extended device data
  type ExtendedDevice = Device & { _repairJobData: RepairJobWithDevice; _repairPosition: number; _totalRepairs: number }

  // Create wrapper functions that cast the device to ExtendedDevice
  const renderActionsWrapper = (device: Device) => renderActions(device as ExtendedDevice)
  const renderCellWrapper = (device: Device, column: DeviceTableColumn) => renderCell(device as ExtendedDevice, column)

  const renderActions = (device: ExtendedDevice) => {
    const repairJob = device._repairJobData
    
    // Check if user already has an active repair
    const hasActiveRepair = repairJobs.some(r => 
      r.assigned_to === currentUser?.id && r.status === 'in_progress'
    )

    // Check if technician can perform this repair type
    const canPerformRepair = currentUser?.technician_level 
      ? canTechnicianPerformRepair(currentUser.technician_level, repairJob.repair_type)
      : true // Non-technicians or unknown level can see all repairs

    return (
      <div className="flex items-center gap-2">
        <Link href={`/devices/${repairJob.device_internal_id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View Device
          </Button>
        </Link>
        
        {repairJob.status === 'pending' && canPerformRepair && (
          <Button 
            size="sm"
            onClick={() => onStartRepair(repairJob)}
            disabled={hasActiveRepair || (typeof isStartingRepair === 'function' ? isStartingRepair(repairJob.id) : isStartingRepair)}
            title={hasActiveRepair || (typeof isStartingRepair === 'function' ? isStartingRepair(repairJob.id) : isStartingRepair) ? "Complete or cancel current repair first" : "Start this repair"}
          >
            <ClipboardCheck className="h-4 w-4 mr-1" />
            {(typeof isStartingRepair === 'function' ? isStartingRepair(repairJob.id) : isStartingRepair) ? 'Starting...' : 'Start Repair'}
          </Button>
        )}
        
        {repairJob.status === 'in_progress' && repairJob.assigned_to === currentUser?.id && (
          <>
            <Button 
              size="sm"
              onClick={() => onCompleteRepair(repairJob)}
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
  const renderCell = (device: ExtendedDevice, column: DeviceTableColumn) => {
    const repairJob = device._repairJobData
    const repairConfig = repairTypeConfig[repairJob.repair_type as keyof typeof repairTypeConfig]
    const statusInfo = repairStatusConfig[repairJob.status as keyof typeof repairStatusConfig]
    
    switch (column) {
      case 'internal_id':
        // Check if this is a repair job with position info
        const repairPosition = device._repairPosition
        const totalRepairs = device._totalRepairs
        
        return (
          <div className="flex items-center gap-[3px]">
            <div className="font-medium">{device.internal_id}</div>
            {repairPosition && totalRepairs && totalRepairs > 1 && (
              <Badge variant="secondary" className="text-xs">
                {repairPosition} of {totalRepairs}
              </Badge>
            )}
          </div>
        )
      
      case 'device':
        // Show device model without grouping
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{device.model}</span>
          </div>
        )
      
      case 'imei':
        // Use imei column to show repair type
        const RepairIcon = repairConfig?.icon || Wrench
        const repairTypeContent = (
          <div className="flex items-center gap-2">
            <RepairIcon className="h-4 w-4 text-gray-600" />
            <span>{repairConfig?.label}</span>
            <Badge variant="outline" className="text-xs">
              {repairConfig?.level}
            </Badge>
          </div>
        )
        
        // Add tooltip for "Other Repair" type - show description if available
        if (repairJob.repair_type === 'other' && repairJob.description) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {repairTypeContent}
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm font-medium mb-1">Repair Description:</p>
                  <p className="text-sm">{repairJob.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }
        
        return repairTypeContent
      

      
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
      renderActions={renderActionsWrapper}
      currentPage={currentPage}
      totalPages={totalPages}
      totalResults={totalResults}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      title={`Repair Queue (${totalResults} individual repairs)`}
      renderFilters={renderFilters}
      pageKey="repair-jobs"
      renderCell={renderCellWrapper}
      customHeaders={{
        'internal_id': 'Internal ID',
        'device': 'Device',
        'imei': 'Repair Type',  // Custom header
        'status': 'Status',
        'grade': 'Created',     // Custom header
        'actions': 'Actions',
        'batch': 'Batch',
        'serial_number': 'Serial Number',
        'required_repairs': 'Required Repairs'
      }}
    />
  )
}
