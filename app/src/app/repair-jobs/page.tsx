'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Wrench } from 'lucide-react';
import { RepairJobListTable, CompleteRepairDialog } from '@/components/repair-jobs';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { useRepairJobs } from '@/lib/hooks/use-repair-jobs';
import { useBatches } from '@/lib/hooks/use-batches';
import { useSpareParts } from '@/lib/hooks/use-spare-parts';
import { useStartRepairJob, useCompleteRepairJob, useUpdateRepairJob } from '@/lib/hooks/use-repair-jobs';
import { RepairJob, SparePart } from '@/lib/types/business-types';
import { DEFAULT_ITEMS_PER_PAGE } from '@/lib/constants';
import { useProfile } from '@/lib/hooks/use-profile-optimized';
import { canTechnicianPerformRepair, getTechnicianRepairTypes } from '@/lib/config/permissions';

// Import configs from the table component
import { repairTypeConfig } from '@/components/repair-jobs/repair-job-list-table';
import { useUser } from '@/lib/hooks/use-user';
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
  const [statusFilter, setStatusFilter] = useState('all') // Default to all jobs
  const [currentPage, setCurrentPage] = useState(1)
  const user = useUser()
  const [loading, setLoading] = useState(false)
  // Fetch real data from API
  const { data: repairJobsData, isPending: repairJobsLoading, error: repairJobsError, refetch: refetchRepairJobs, isFetching: repairJobsFetching } = useRepairJobs()
  const { data: batchesData, isPending: batchesLoading, refetch: refetchBatches } = useBatches()
  const { data: sparePartsData, isPending: sparePartsLoading, refetch: refetchSpareParts, isFetching: sparePartsFetching } = useSpareParts()
  const { data: profile } = useProfile(!!user)

  // Refetch data every time the component mounts (page visit)
  useEffect(() => {
    refetchRepairJobs()
    refetchBatches()
    refetchSpareParts()
  }, [refetchRepairJobs, refetchBatches, refetchSpareParts])
  
  // Update repair job mutation
  const updateRepairJob = useUpdateRepairJob()
  
  // Start repair job mutation (updates device status to in_repair)
  const startRepairJob = useStartRepairJob()
  
  // Complete repair job mutation (sends device to QC)
  const completeRepairJob = useCompleteRepairJob()
  
  // Track which repair job is currently being started
  const [startingRepairId, setStartingRepairId] = useState<string | null>(null)
  
  // Handle start repair success/error
  useEffect(() => {
    if (startRepairJob.isSuccess) {
      setStartingRepairId(null) // Clear loading state
      // The hook will automatically invalidate queries
    }
    if (startRepairJob.isError) {
      setStartingRepairId(null) // Clear loading state
      // You could show a toast notification here
    }
  }, [startRepairJob.isSuccess, startRepairJob.isError, startRepairJob.error, startRepairJob.isPending])
  
  // Handle complete repair success/error
  useEffect(() => {
    if (completeRepairJob.isSuccess) {
      // The hook will automatically invalidate queries
    }
    if (completeRepairJob.isError) {
      // You could show a toast notification here
    }
  }, [completeRepairJob.isSuccess, completeRepairJob.isError, completeRepairJob.error, completeRepairJob.isPending, completeRepairJob.data])
  
  // Reset page when filters change
  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setCurrentPage(1)
  }
  
  // Clear all filters function
  const handleClearFilters = () => {
    setSearchTerm('')
    setLevelFilter('all')
    setTypeFilter('all')
    setStatusFilter('all')
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
  if (repairJobsLoading || batchesLoading || sparePartsLoading || repairJobsFetching || sparePartsFetching) {
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
  const spareParts = (sparePartsData || []) as SparePart[]
  
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
        case 'history':
          if (!['failed', 'cancelled'].includes(repair.status)) return false
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

    // Technician level filter - hide repairs that current technician cannot perform
    if (profile?.role === 'technician' && profile?.technician_level) {
      const canPerform = canTechnicianPerformRepair(profile.technician_level, repair.repair_type)
      if (!canPerform) return false
    }

    // Hide completed repairs for all users
    if (repair.status === 'completed') {
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
    repair.assigned_to === user?.user?.id && repair.status === 'in_progress'
  )

  // Pagination calculations
  const totalResults = sortedRepairs.length
  const totalPages = Math.ceil(totalResults / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRepairs = sortedRepairs.slice(startIndex, endIndex)
  
  const handleStartRepair = (repair: RepairJob) => {
    
    if (!user?.user?.id) {
      return
    }
    
    // Find the transformed repair job data
    const transformedRepair = transformedRepairJobs.find(r => r.id === repair.id)
    if (!transformedRepair) {
      return
    }
    
    setConfirmDialog({
      open: true,
      title: 'Start Repair',
      description: `Are you sure you want to start the ${repairTypeConfig[repair.repair_type as keyof typeof repairTypeConfig]?.label} repair for device ${transformedRepair.device_internal_id}?`,
      action: () => {
        try {
          
          // Set loading state for this specific repair job
          setStartingRepairId(repair.id)
          
          // Start the repair job using the API (this will update device status to in_repair)
          startRepairJob.mutate({
            repairJobId: repair.id,
            assignedTo: user?.user?.id
          })
        } catch (error) {
          console.error('Error starting repair job:', error)
          setStartingRepairId(null) // Clear loading state on error
        }
        
        setConfirmDialog({ open: false, title: '', description: '', action: () => {} })
      }
    })
  }

  const handleCompleteRepair = (repair: RepairJob) => {
    setPartsRecording({
      repairId: repair.id,
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

  const submitCompleteRepair = (parts?: Array<{ spare_part_id: string; quantity_used: number; notes?: string }>, notes?: string) => {
    if (!partsRecording.repairId) {
      return
    }

    setLoading(true)

    const mutationData = {
      repairJobId: partsRecording.repairId,
      completionNotes: notes || partsRecording.notes || undefined,
      partsUsed: parts || partsRecording.parts.map(part => ({
        spare_part_id: part.partId,
        quantity_used: part.quantity,
        notes: undefined
      }))
    }

    // Complete the repair job and send device to QC
    completeRepairJob.mutate(mutationData, {
      onSuccess: (_data) => {
        setLoading(false)
        setPartsRecording({
          repairId: null,
          parts: [],
          notes: ''
        })
      },
      onError: (_error) => {
        setLoading(false)
      }
    })
  }

  // Render filters for the table (consistent with devices/qc pages)
  const renderFilters = () => {
    // Get available repair types for current technician
    const availableRepairTypes = profile?.role === 'technician' && profile?.technician_level
      ? getTechnicianRepairTypes(profile.technician_level)
      : ['housing_change', 'glass_change', 'battery_change', 'software_update', 'other'] // All types for non-technicians
    
    const hasActiveFilters = searchTerm.trim() !== '' || 
                           statusFilter !== 'all' || 
                           (profile?.role !== 'technician' && levelFilter !== 'all') || 
                           typeFilter !== 'all'
    
    return (
      <div className="space-y-3">
        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Active filters:</span>
            {searchTerm.trim() !== '' && (
              <Badge variant="secondary" className="text-xs">
                Search: &quot;{searchTerm}&quot;
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Status: {statusFilter}
              </Badge>
            )}
{profile?.role !== 'technician' && levelFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Level: {levelFilter}
              </Badge>
            )}
            {typeFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Type: {typeFilter}
              </Badge>
            )}
          </div>
        )}
        
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


{/* Level filter - only show for non-technicians */}
            {profile?.role !== 'technician' && (
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
            )}

            <Select value={typeFilter} onValueChange={handleFilterChange(setTypeFilter)}>
              <SelectTrigger className={`h-9 w-[140px] ${typeFilter !== 'all' ? 'border-blue-500 bg-blue-50' : ''}`}>
                <SelectValue placeholder="Repair Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {availableRepairTypes.includes('housing_change') && (
                  <SelectItem value="housing_change">Housing</SelectItem>
                )}
                {availableRepairTypes.includes('glass_change') && (
                  <SelectItem value="glass_change">Glass</SelectItem>
                )}
                {availableRepairTypes.includes('battery_change') && (
                  <SelectItem value="battery_change">Battery</SelectItem>
                )}
                {availableRepairTypes.includes('software_update') && (
                  <SelectItem value="software_update">Software</SelectItem>
                )}
                {availableRepairTypes.includes('other') && (
                  <SelectItem value="other">Other</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className={`h-9 ${hasActiveFilters ? 'border-red-300 bg-red-50 hover:bg-red-100' : ''}`}
            >
              Clear Filters
              {hasActiveFilters && (
                              <span className="ml-1 text-xs text-red-600">
                ({[searchTerm.trim() !== '', statusFilter !== 'all', levelFilter !== 'all', typeFilter !== 'all'].filter(Boolean).length})
              </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
                {/* <Info className="h-5 w-5 text-blue-600" /> */}
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
                  onClick={() => handleCompleteRepair(activeRepair)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Completing...' : 'Complete Repair'}
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
            currentUser={user?.user?.id && profile ? {
              id: user?.user?.id,
              full_name: profile.full_name || 'Current User',
              role: profile.role || 'technician',
              technician_level: profile.technician_level || null
            } : undefined}
            onStartRepair={handleStartRepair}
            onCompleteRepair={handleCompleteRepair}
            onCancelRepair={handleCancelRepair}
            repairCountByDevice={repairCountByDevice}
            isStartingRepair={(repairId: string) => startingRepairId === repairId}
          />
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open: boolean) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.title.includes('Cancel') ? 'Cancel Repair' : 'Start Repair'}
        onConfirm={confirmDialog.action}
      />

      {/* Complete Repair Dialog */}
      <CompleteRepairDialog
        isOpen={!!partsRecording.repairId}
        onClose={() => setPartsRecording({ 
          repairId: null, 
          parts: [], 
          notes: '' 
        })}
        onComplete={(parts, notes) => {
          submitCompleteRepair(parts, notes)
        }}
        spareParts={spareParts}
        isLoading={completeRepairJob.isPending || loading}
      />
    </div>
  )
} 