'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmationDialog } from '@/components/common/confirmation-dialog'
import { RepairJobListTable } from '@/components/repair-jobs/repair-job-list-table'

import {
  Wrench,
  Search,
  Plus,
  Minus,
  X,
  Info
} from 'lucide-react'

import { useRepairJobs, useUpdateRepairJob } from '@/lib/hooks/use-repair-jobs'
import { useBatches } from '@/lib/hooks/use-batches'
import { useSpareParts } from '@/lib/hooks/use-spare-parts'
import { DEFAULT_ITEMS_PER_PAGE } from '@/lib/constants'
import { RepairJob } from '@/lib/types/business-types'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { createClient } from '@/lib/supabase/client'

// Import configs from the table component
import { repairTypeConfig } from '@/components/repair-jobs/repair-job-list-table'

// Extended RepairJob type with joined data from API
interface RepairJobWithDevice extends RepairJob {
  device: {
    internal_id: string
    imei: string
    brand?: string
    model?: string
  }
  assigned_to_name?: string
}

// Transformed repair job with additional computed fields
interface TransformedRepairJob extends RepairJobWithDevice {
  device_internal_id: string
  device_model: string
}

export default function RepairJobsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('available') // Default to available jobs
  const [currentPage, setCurrentPage] = useState(1)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Fetch real data from API
  const { data: repairJobsData, isLoading: repairJobsLoading, error: repairJobsError } = useRepairJobs()
  const { data: batchesData, isLoading: batchesLoading } = useBatches()
  const { data: sparePartsData, isLoading: sparePartsLoading } = useSpareParts()

  // Get current user ID from Supabase
  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])
  
  // Update repair job mutation
  const updateRepairJob = useUpdateRepairJob()
  
  // Reset page when filters change
  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setCurrentPage(1)
  }
  
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => void
  }>({
    open: false,
    title: '',
    description: '',
    action: () => {}
  })

  // Parts recording state
  const [partsRecording, setPartsRecording] = useState<{
    repairId: string | null
    parts: Array<{ partId: string; quantity: number }>
    notes: string
  }>({
    repairId: null,
    parts: [],
    notes: ''
  })

  // Show loading state while data is being fetched
  if (repairJobsLoading || batchesLoading || sparePartsLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  // Show error state if there's an error
  if (repairJobsError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading repair jobs: {repairJobsError.message}</p>
        </div>
      </div>
    )
  }

  // Transform API data to match expected format for the table component
  const repairJobs = (repairJobsData || []) as RepairJobWithDevice[]
  const transformedRepairJobs = repairJobs.map(repair => ({
    ...repair,
    device_internal_id: repair.device?.internal_id || 'N/A',
    device_model: repair.device?.model || 'Unknown',
    // Use actual assigned user data from API
    assigned_to_name: repair.assigned_to_name || undefined
  })) as TransformedRepairJob[]
  
  const batches = batchesData || []
  const spareParts = sparePartsData || []

  // Apply filters to repair jobs
  const filteredRepairs = transformedRepairJobs.filter(repair => {
    // Search filter - check IMEI and Internal ID
    if (searchTerm && searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase()
      const imeiMatch = repair.device?.imei?.toLowerCase().includes(searchLower)
      const internalIdMatch = repair.device_internal_id?.toLowerCase().includes(searchLower)
      if (!imeiMatch && !internalIdMatch) return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'available':
          if (repair.status !== 'pending') return false
          break
        case 'my_active':
          if (repair.status !== 'in_progress' || repair.assigned_to !== currentUserId) return false
          break
        case 'all_active':
          if (repair.status !== 'in_progress') return false
          break
        case 'history':
          if (!['completed', 'failed', 'cancelled'].includes(repair.status)) return false
          break
        default:
          // 'all' status - no filtering
          break
      }
    }

    // Level filter - check technician level requirements for repair types
    if (levelFilter !== 'all') {
      const repairLevel = repairTypeConfig[repair.repair_type as keyof typeof repairTypeConfig]?.level
      if (repairLevel !== levelFilter && repairLevel !== 'Any') return false
    }

    // Type filter
    if (typeFilter !== 'all' && repair.repair_type !== typeFilter) {
      return false
    }

    return true
  })
  
  // Group repairs by device_internal_id to show "1 of 3", "2 of 3" etc.
  const repairCountByDevice: Record<string, number> = {}
  filteredRepairs.forEach(repair => {
    const deviceId = repair.device_internal_id || 'unknown'
    repairCountByDevice[deviceId] = (repairCountByDevice[deviceId] || 0) + 1
  })

  // Sort repairs by creation date (newest first)
  const sortedRepairs = [...filteredRepairs].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // Find current user's active repair for banner - this should come from auth context
  const activeRepair = transformedRepairJobs.find(repair => 
    repair.assigned_to === currentUserId && repair.status === 'in_progress'
  )

  // Pagination calculations
  const totalResults = sortedRepairs.length
  const totalPages = Math.ceil(totalResults / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRepairs = sortedRepairs.slice(startIndex, endIndex)
  
  const handleStartRepair = (repair: RepairJob) => {
    if (!currentUserId) {
      // Handle case when user is not authenticated
      return
    }
    
    // Find the transformed repair job data
    const transformedRepair = transformedRepairJobs.find(r => r.id === repair.id)
    if (!transformedRepair) return
    
    setConfirmDialog({
      open: true,
      title: 'Start Repair',
      description: `Are you sure you want to start the ${repairTypeConfig[repair.repair_type as keyof typeof repairTypeConfig]?.label} repair for device ${transformedRepair.device_internal_id}?`,
      action: () => {
        // Update the repair job using the API
        updateRepairJob.mutate({
          id: repair.id,
          data: {
            status: 'in_progress',
            assigned_to: currentUserId, // Use current user ID
            assigned_at: new Date().toISOString()
          }
        })
        
        setConfirmDialog({ ...confirmDialog, open: false })
      }
    })
  }

  const handleCompleteRepair = (repairId: string) => {
    setPartsRecording({
      repairId,
      parts: [],
      notes: ''
    })
  }

  const handleCancelRepair = (repairId: string) => {
    const repair = transformedRepairJobs.find(r => r.id === repairId)
    setConfirmDialog({
      open: true,
      title: 'Cancel Repair Job',
      description: `Are you sure you want to cancel this repair for Device ${repair?.device_internal_id}?\n\nThis action will:\n• Return the job to the repair queue\n• Allow other technicians to pick it up\n• Clear your assignment from this repair\n\nThis action should only be used if you cannot complete the repair (missing parts, equipment issues, etc.).`,
      action: () => {
        // Update the repair job using the API
        updateRepairJob.mutate({
          id: repairId,
          data: {
            status: 'pending',
            assigned_to: undefined,
            assigned_at: undefined
          }
        })
        
        setConfirmDialog({ ...confirmDialog, open: false })
      }
    })
  }

  const submitCompleteRepair = () => {
    if (!partsRecording.repairId) return

    // Update the repair job to completed
    updateRepairJob.mutate({
      id: partsRecording.repairId,
      data: {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_notes: partsRecording.notes || undefined
      }
    })
    
    // Note: In a real implementation, you would also:
    // 1. Record parts usage in the repair_parts_used table
    // 2. Update inventory quantities
    // 3. Update device status if all repairs are completed
    
    setPartsRecording({
      repairId: null,
      parts: [],
      notes: ''
    })
  }

  // Render filters for the table (consistent with devices/qc pages)
  const renderFilters = () => (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full md:w-64">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          id="search"
          placeholder="Search IMEI / Internal ID"
          aria-label="Search IMEI or Internal ID"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className={`h-9 pl-8 ${searchTerm.trim() !== '' ? 'border-blue-500 bg-blue-50' : ''}`}
        />
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
          <SelectTrigger className={`h-9 w-[140px] ${statusFilter !== 'all' ? 'border-blue-500 bg-blue-50' : ''}`}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="my_active">My Active</SelectItem>
            <SelectItem value="all_active">All Active</SelectItem>
            <SelectItem value="history">History</SelectItem>
            <SelectItem value="all">All Status</SelectItem>
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={handleFilterChange(setLevelFilter)}>
          <SelectTrigger className={`h-9 w-[120px] ${levelFilter !== 'all' ? 'border-blue-500 bg-blue-50' : ''}`}>
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="L1">L1 Only</SelectItem>
            <SelectItem value="L2">L2 Only</SelectItem>
            <SelectItem value="L3">L3 Only</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={handleFilterChange(setTypeFilter)}>
          <SelectTrigger className={`h-9 w-[140px] ${typeFilter !== 'all' ? 'border-blue-500 bg-blue-50' : ''}`}>
            <SelectValue placeholder="Repair Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="housing_change">Housing</SelectItem>
            <SelectItem value="glass_change">Glass</SelectItem>
            <SelectItem value="battery_change">Battery</SelectItem>
            <SelectItem value="software_update">Software</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchTerm('')
            setLevelFilter('all')
            setTypeFilter('all')
            setStatusFilter('available')
            setCurrentPage(1)
          }}
          className="h-9"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Repair Queue
          </h1>
          <p className="text-gray-600">Self-select and complete repair tasks</p>
        </div>
        {/* Remove TechnicianSimulator as it was using mock data */}
      </div>

      {/* Active Job Banner */}
      {activeRepair && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">
                    Currently working on: Device {activeRepair.device_internal_id} - {repairTypeConfig[activeRepair.repair_type as keyof typeof repairTypeConfig]?.label}
                  </h3>
                  <p className="text-sm text-blue-700">
                    Started {activeRepair.assigned_at ? new Date(activeRepair.assigned_at).toLocaleString() : 'recently'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleCompleteRepair(activeRepair.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Complete Job
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancelRepair(activeRepair.id)}
                  className="text-gray-600 hover:bg-gray-100 text-xs px-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repair Jobs Table */}
      <Card>
        <CardContent>
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredRepairs.length} of {transformedRepairJobs.length} repair jobs
          </div>
          <RepairJobListTable
            repairJobs={paginatedRepairs}
            allRepairJobs={transformedRepairJobs}
            batches={batches}
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={totalResults}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            renderFilters={renderFilters}
            currentUser={currentUserId ? {
              id: currentUserId,
              full_name: 'Current User', // This should come from user profile
              role: 'technician', // This should come from user profile
              technician_level: 'L2' // This should come from user profile
            } : undefined}
            onStartRepair={handleStartRepair}
            onCompleteRepair={handleCompleteRepair}
            onCancelRepair={handleCancelRepair}
            repairCountByDevice={repairCountByDevice}
          />
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Start Repair"
        onConfirm={confirmDialog.action}
      />

      {/* Parts Recording Dialog */}
      {partsRecording.repairId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Complete Repair</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Add Parts (Optional):</label>
                <Select value="" onValueChange={(partId) => {
                  if (partId && !partsRecording.parts.find(p => p.partId === partId)) {
                    const newParts = [...partsRecording.parts, { partId, quantity: 1 }]
                    setPartsRecording({ ...partsRecording, parts: newParts })
                  }
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select part" />
                  </SelectTrigger>
                  <SelectContent>
                    {spareParts
                      .filter(part => !partsRecording.parts.find(p => p.partId === part.id))
                      .map(part => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.name} (Stock: {part.quantity_in_stock})
                        </SelectItem>
                      ))}
                    {spareParts.filter(part => !partsRecording.parts.find(p => p.partId === part.id)).length === 0 && (
                      <div className="p-2 text-sm text-gray-500">All parts already added</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Parts list will be displayed here */}
              {partsRecording.parts.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Selected Parts:</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {partsRecording.parts.map((part, index) => {
                      const sparePart = spareParts.find(p => p.id === part.partId)
                      return (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="flex-1 text-sm">{sparePart?.name}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newParts = [...partsRecording.parts]
                                if (newParts[index].quantity > 1) {
                                  newParts[index].quantity--
                                  setPartsRecording({ ...partsRecording, parts: newParts })
                                }
                              }}
                              disabled={part.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{part.quantity}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newParts = [...partsRecording.parts]
                                const maxStock = sparePart?.quantity_in_stock || 999
                                if (newParts[index].quantity < maxStock) {
                                  newParts[index].quantity++
                                  setPartsRecording({ ...partsRecording, parts: newParts })
                                }
                              }}
                              disabled={part.quantity >= (sparePart?.quantity_in_stock || 999)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newParts = partsRecording.parts.filter((_, i) => i !== index)
                              setPartsRecording({ ...partsRecording, parts: newParts })
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Total parts: {partsRecording.parts.reduce((sum, p) => sum + p.quantity, 0)}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Input
                  placeholder="Completion notes..."
                  value={partsRecording.notes}
                  onChange={(e) => setPartsRecording({ 
                    ...partsRecording, 
                    notes: e.target.value 
                  })}
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setPartsRecording({ 
                    repairId: null, 
                    parts: [], 
                    notes: '' 
                  })}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={submitCompleteRepair} className="flex-1">
                  Complete Repair {partsRecording.parts.length > 0 && `(${partsRecording.parts.length} parts)`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 