'use client'

import { ReactNode, useState, useEffect } from 'react';
import { DEVICE_STATUS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Package, Clock,
  Wrench,
  CheckCircle
} from 'lucide-react';
import { Device, Batch } from '@/lib/types/business-types';
import { repairTypes } from '@/components/common/repair-task-selector';

// Extended Device interface for repair job display
interface ExtendedDevice extends Device {
  _repairPosition?: number
  _totalRepairs?: number
}

// Device status to icon/color mapping
export const statusConfig = {
  [DEVICE_STATUS.received]: { icon: Package, color: 'bg-gray-500', label: 'Received' },
  [DEVICE_STATUS.awaiting_repair]: { icon: Clock, color: 'bg-yellow-500', label: 'Awaiting Repair' },
  [DEVICE_STATUS.in_repair]: { icon: Wrench, color: 'bg-orange-500', label: 'In Repair' },
  [DEVICE_STATUS.final_qc]: { icon: CheckCircle, color: 'bg-purple-500', label: 'Final QC' },
  [DEVICE_STATUS.graded]: { icon: CheckCircle, color: 'bg-green-500', label: 'Graded' }
}

export type DeviceTableColumn = 
  | 'internal_id' 
  | 'device' 
  | 'imei' 
  | 'batch' 
  | 'status' 
  | 'grade' 
  | 'serial_number'
  | 'required_repairs'
  | 'actions'

interface DeviceListTableProps {
  devices: ExtendedDevice[]
  batches: Batch[]
  columns: DeviceTableColumn[]
  renderActions: (device: ExtendedDevice) => ReactNode
  currentPage: number
  totalPages: number
  totalResults: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  title?: string
  renderFilters?: () => ReactNode
  pageKey?: string // For localStorage key (e.g., 'devices', 'qc', 'device-tracking')
  renderCell?: (device: ExtendedDevice, column: DeviceTableColumn) => ReactNode | null // Custom cell renderer
  customHeaders?: Record<DeviceTableColumn, string> // Custom column headers
}

export function DeviceListTable({
  devices,
  batches,
  columns,
  renderActions,
  currentPage,
  totalPages,
  totalResults,
  itemsPerPage,
  onPageChange,
  title = "Devices",
  renderFilters,
  pageKey = "default",
  renderCell: customRenderCell,
  customHeaders
}: DeviceListTableProps) {
  
  // Debug logging for repair jobs

  
  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalResults)

  // Filter visibility state with persistence
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  // Load filter state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`filters-expanded-${pageKey}`)
    if (stored !== null) {
      setFiltersExpanded(JSON.parse(stored))
    }
  }, [pageKey])

  // Save filter state to localStorage when changed
  const toggleFilters = () => {
    const newState = !filtersExpanded
    setFiltersExpanded(newState)
    localStorage.setItem(`filters-expanded-${pageKey}`, JSON.stringify(newState))
  }

  const getColumnHeader = (column: DeviceTableColumn): string => {
    // Use custom header if provided
    if (customHeaders && customHeaders[column]) {
      return customHeaders[column]
    }
    
    // Default headers
    switch (column) {
      case 'internal_id': return 'Internal ID'
      case 'device': return 'Device'
      case 'imei': return 'IMEI'
      case 'batch': return 'Batch'
      case 'status': return 'Status'
      case 'grade': return 'Grade'
      case 'serial_number': return 'Serial Number'
      case 'required_repairs': return 'Required Repairs'
      case 'actions': return 'Actions'
      default: return ''
    }
  }

  const renderCell = (device: ExtendedDevice, column: DeviceTableColumn) => {
    const batch = batches.find(b => b.id === device.batch_id)

    switch (column) {
      case 'internal_id':
        // Check if this is a repair job with position info
        const repairPosition = device._repairPosition
        const totalRepairs = device._totalRepairs
        
        return (
          <div className="flex items-center">
            <Smartphone className="mr-2 h-4 w-4 text-gray-400" />
            <div className="flex flex-col">
              <span className="font-mono font-medium">{device.internal_id}</span>
              {repairPosition && totalRepairs && totalRepairs > 1 && (
                <span className="text-xs text-blue-600 font-medium">
                  {repairPosition} of {totalRepairs}
                </span>
              )}
            </div>
          </div>
        )
      
      case 'device':
        return (
          <div>
            <div className="font-medium">{device.brand} {device.model}</div>
            <div className="text-sm text-gray-600">
              {device.color} • {device.storage_capacity}
            </div>
          </div>
        )
      
      case 'imei':
        return <span className="font-mono text-sm">{device.imei || '-'}</span>
      
      case 'batch':
        return <span className="text-sm">{batch?.batch_number || '-'}</span>
      
      case 'status':
        const status = statusConfig[device.status as keyof typeof statusConfig]
        const StatusIcon = status?.icon
        return (
          <Badge variant="outline" className="gap-1">
            {StatusIcon && <StatusIcon className="h-3 w-3" />}
            {status?.label || device.status || 'Unknown'}
          </Badge>
        )
      
      case 'grade':
        // First check if there's a grade from QC data, then fall back to device.grade
        const qcGrade = device.dr_phone_data?.qc_data?.selected_grade
        const displayGrade = qcGrade || device.grade
        
        return displayGrade && displayGrade !== 'ungraded' ? (
          <Badge variant="default">Grade {displayGrade}</Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      
      case 'serial_number':
        return <span className="font-mono text-sm">{device.serial_number || '-'}</span>
      
      case 'required_repairs':
        const repairs = device.dr_phone_data?.required_repairs
        if (!repairs || repairs.length === 0) return <span className="text-gray-400">-</span>
        
        return (
          <div className="space-y-1 max-w-[200px]">
            {repairs.map((repairId: string, index: number) => {
              // Get repair label from repair types
              const repairType = repairTypes.find(rt => rt.id === repairId)
              return (
                <Badge key={index} variant="secondary" className="text-xs">
                  {repairType?.label || repairId}
                </Badge>
              )
            })}
            {device.dr_phone_data?.other_repair_description && (
              <div className="text-xs text-gray-600 mt-1 italic">
                &quot;{device.dr_phone_data.other_repair_description}&quot;
              </div>
            )}
          </div>
        )
      
      case 'actions':
        return renderActions(device)
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters Toggle Button */}
      {renderFilters && (
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium">
            {title} ({totalResults} results)
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFilters}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {filtersExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Collapsible Filters Section */}
      {renderFilters && (
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            filtersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pb-4 border-b">
            {renderFilters()}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left">
              {columns.map((column) => (
                <th key={column} className="pb-2 font-medium">
                  {getColumnHeader(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {devices.length > 0 ? (
              <>
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={column} className="py-3">
                        {customRenderCell ? customRenderCell(device, column) || renderCell(device, column) : renderCell(device, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-500">
                  No devices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex}-{endIndex} of {totalResults} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
