'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Wrench, ArrowLeft } from 'lucide-react';
import { RepairJobListTable, CompleteRepairDialog } from '@/components/repair-jobs';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { EditFaultsDialog } from '@/components/devices/edit-faults-dialog';
import { useRepairJobs } from '@/lib/hooks/use-repair-jobs';
import { useBatches } from '@/lib/hooks/use-batches';
import { useSpareParts } from '@/lib/hooks/use-spare-parts';
import { useStartRepairJob, useCompleteRepairJob, useUpdateRepairJob } from '@/lib/hooks/use-repair-jobs';
import { RepairJob, SparePart } from '@/lib/types/business-types';
import { DEFAULT_ITEMS_PER_PAGE } from '@/lib/constants';
import { useProfile } from '@/lib/hooks/use-profile-optimized';
import { canTechnicianPerformRepair, getTechnicianRepairTypes } from '@/lib/config/permissions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Link from 'next/link';

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
  assigned_user?: {
    full_name: string
    technician_level: string | null
  }
}

// Transformed repair job with additional computed fields
interface TransformedRepairJob extends RepairJobWithDevice {
  device_internal_id: string
  device_model: string
}

const REPAIR_TYPE_LABELS: Record<string, string> = {
  housing_change: 'Housing Change',
  glass_change: 'Glass Change',
  battery_change: 'Battery Change',
  software_update: 'Software Update',
  other: 'Other'
}

function RepairJobsPageContent() {
  const searchParams = useSearchParams()
  const fromReport = searchParams.get('fromReport') === 'true'
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const technicianIds = searchParams.getAll('technicianId')
  const repairTypes = searchParams.getAll('repairType')

  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // Default to all jobs
  const [currentPage, setCurrentPage] = useState(1)
  const user = useUser()
  const [loading, setLoading] = useState(false)
  
  // Edit Faults Dialog state
  const [editFaultsDialog, setEditFaultsDialog] = useState<{
    open: boolean
    deviceId: string
    deviceInternalId: string
  }>({ open: false, deviceId: '', deviceInternalId: '' })
  // Fetch real data from API
  // When fromReport=true, use API endpoint that returns assigned_user
  // Otherwise, use the hook that uses direct Supabase access
  const { data: repairJobsFromAPI, isPending: repairJobsFromAPILoading, error: repairJobsFromAPIError } = useQuery({
    queryKey: ['repair-jobs-from-api', fromReport, dateFrom, dateTo, technicianIds, repairTypes],
    queryFn: async () => {
      if (!fromReport) return null
      try {
        const params = new URLSearchParams()
        if (dateFrom && dateTo) {
          params.set('dateFrom', dateFrom)
          params.set('dateTo', dateTo)
        }
        technicianIds.forEach(id => params.append('technicianId', id))
        repairTypes.forEach(type => params.append('repairType', type))
        params.set('status', 'completed')
        
        const response = await fetch(`/api/repair-jobs?${params.toString()}`, {
          credentials: 'include'
        })
        if (!response.ok) {
          console.error('❌ Failed to fetch repair jobs from API:', response.status, response.statusText)
          return null
        }
        const result = await response.json()
        console.log('📦 Repair jobs from API response:', result)
        return result.data || []
      } catch (error) {
        console.error('❌ Error fetching repair jobs from API:', error)
        return null
      }
    },
    enabled: fromReport
  })

  const { data: repairJobsData, isPending: repairJobsLoading, error: repairJobsError, refetch: refetchRepairJobs, isFetching: repairJobsFetching } = useRepairJobs()
  const { data: batchesData, isPending: batchesLoading, refetch: refetchBatches } = useBatches()
  const { data: sparePartsData, isPending: sparePartsLoading, refetch: refetchSpareParts, isFetching: sparePartsFetching } = useSpareParts()
  const { data: profile } = useProfile(!!user)

  // Use API data when fromReport, otherwise use hook data
  const actualRepairJobsData = fromReport && repairJobsFromAPI ? repairJobsFromAPI : repairJobsData
  const actualRepairJobsLoading = fromReport ? repairJobsFromAPILoading : repairJobsLoading
  const actualRepairJobsError = fromReport ? repairJobsFromAPIError : repairJobsError

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

  // Transform API data to match expected format for the table component (before early returns)
  const repairJobs = (actualRepairJobsData || []) as RepairJobWithDevice[]
  const transformedRepairJobs = repairJobs.map(repair => ({
    ...repair,
    device_internal_id: repair.device?.internal_id || 'N/A',
    device_model: repair.device?.model || 'Unknown',
    // Use actual assigned user data from API
    assigned_to_name: repair.assigned_to_name || undefined
  })) as TransformedRepairJob[]

  // techniciansMap must be called before any early returns (Rules of Hooks)
  // When fromReport=true, API endpoint returns assigned_user, so we use that
  // Otherwise, we'd need to fetch technicians separately
  const techniciansMap = useMemo(() => {
    console.log('🔧 Building techniciansMap, fromReport:', fromReport)
    console.log('📊 transformedRepairJobs count:', transformedRepairJobs.length)
    
    const map = new Map<string, { full_name: string; technician_level: string | null }>()
    
    // Extract technicians from repair jobs (API endpoint returns assigned_user)
    transformedRepairJobs.forEach(repair => {
      if (repair.assigned_to && repair.assigned_user) {
        if (!map.has(repair.assigned_to)) {
          console.log('✅ Adding technician from repair job:', repair.assigned_to, repair.assigned_user)
          map.set(repair.assigned_to, {
            full_name: repair.assigned_user.full_name,
            technician_level: repair.assigned_user.technician_level
          })
        }
      } else if (repair.assigned_to) {
        console.log('⚠️ Repair job has assigned_to but no assigned_user:', repair.assigned_to, repair.id)
      }
    })
    
    console.log('📋 Final techniciansMap size:', map.size)
    console.log('📋 Final techniciansMap keys:', Array.from(map.keys()))
    console.log('📋 All assigned_to from repairs:', transformedRepairJobs.map(r => r.assigned_to).filter(Boolean))
    
    return map
  }, [transformedRepairJobs, fromReport])

  // Show loading state while data is being fetched
  if (actualRepairJobsLoading || batchesLoading || sparePartsLoading || (!fromReport && repairJobsFetching) || sparePartsFetching) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  // Show error state if there's an error
  if (actualRepairJobsError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading repair jobs: {actualRepairJobsError instanceof Error ? actualRepairJobsError.message : 'Unknown error'}</p>
        </div>
      </div>
    )
  }
  
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

    // If from report, show only completed repairs with filters
    // Otherwise, hide completed repairs for all users
    if (fromReport) {
      if (repair.status !== 'completed') {
        return false
      }
      // Apply date filter
      if (dateFrom && dateTo && repair.completed_at) {
        const completedDate = dayjs(repair.completed_at).format('YYYY-MM-DD')
        if (completedDate < dateFrom || completedDate > dateTo) {
          return false
        }
      }
      // Apply technician filter
      if (technicianIds.length > 0 && !technicianIds.includes(repair.assigned_to || '')) {
        return false
      }
      // Apply repair type filter
      if (repairTypes.length > 0 && !repairTypes.includes(repair.repair_type)) {
        return false
      }
    } else {
      // Hide completed repairs for normal view
      if (repair.status === 'completed') {
        return false
      }
    }

    return true
  })
  
  // Group repairs by device_internal_id to show "1 of 3", "2 of 3" etc.
  const repairCountByDevice: Record<string, number> = {}
  filteredRepairs.forEach(repair => {
    const deviceId = repair.device_internal_id || 'unknown'
    repairCountByDevice[deviceId] = (repairCountByDevice[deviceId] || 0) + 1
  })

  // Sort repairs - by completion date if from report, otherwise by creation date
  const sortedRepairs = [...filteredRepairs].sort((a, b) => {
    if (fromReport) {
      // Sort by completion date (newest first)
      const aDate = a.completed_at ? new Date(a.completed_at).getTime() : 0
      const bDate = b.completed_at ? new Date(b.completed_at).getTime() : 0
      return bDate - aDate
    } else {
      // Sort by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  // Find current user's active repairs for banner - technicians can now have multiple active repairs
  const activeRepairs = transformedRepairJobs.filter(repair => 
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

  // Handle edit faults
  function handleEditFaults(deviceId: string, deviceInternalId: string) {
    setEditFaultsDialog({
      open: true,
      deviceId,
      deviceInternalId
    })
  }

  // Handle edit faults success - refetch repair jobs
  function handleEditFaultsSuccess() {
    refetchRepairJobs()
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

  // Render report view with simplified table
  if (fromReport) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/reports/device-refurbishing">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Report
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Completed Repair Jobs</h1>
              <p className="text-gray-600">
                {dateFrom && dateTo && `Date Range: ${dayjs(dateFrom).format('DD MMM YYYY')} - ${dayjs(dateTo).format('DD MMM YYYY')}`}
              </p>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Repair Type</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Completed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRepairs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No completed jobs found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRepairs.map((repair) => {
                    const technician = repair.assigned_to ? techniciansMap.get(repair.assigned_to) : null
                    if (!technician && repair.assigned_to) {
                      console.log('⚠️ Technician not found for assigned_to:', repair.assigned_to, 'Map keys:', Array.from(techniciansMap.keys()))
                    }
                    return (
                      <TableRow key={repair.id}>
                        <TableCell className="font-mono">{repair.device_internal_id}</TableCell>
                        <TableCell className="font-mono text-sm">{repair.device?.imei || '-'}</TableCell>
                        <TableCell>{repair.device?.model || 'Unknown'}</TableCell>
                        <TableCell>
                          {REPAIR_TYPE_LABELS[repair.repair_type] || repair.repair_type}
                        </TableCell>
                        <TableCell>
                          {technician ? (
                            <span>
                              {technician.full_name}
                              {technician.technician_level && (
                                <Badge variant="outline" className="ml-2">
                                  {technician.technician_level}
                                </Badge>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Unknown {repair.assigned_to ? `(ID: ${repair.assigned_to})` : '(No ID)'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {repair.completed_at
                            ? dayjs(repair.completed_at).format('YYYY-MM-DD HH:mm')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalResults)} of {totalResults} jobs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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

      {/* Active Jobs Banner */}
      {activeRepairs.length > 0 && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <h3 className="font-medium text-blue-900">
                Currently working on {activeRepairs.length} repair{activeRepairs.length > 1 ? 's' : ''}:
              </h3>
              {activeRepairs.map((repair) => (
                <div key={repair.id} className="flex items-center justify-between bg-white/50 rounded p-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-blue-900">
                        Device {repair.device_internal_id} - {repairTypeConfig[repair.repair_type as keyof typeof repairTypeConfig]?.label}
                      </p>
                      <p className="text-sm text-blue-700">
                        Started {repair.assigned_at ? new Date(repair.assigned_at).toLocaleString() : 'recently'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleCompleteRepair(repair)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={loading}
                    >
                      {loading ? 'Completing...' : 'Complete'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelRepair(repair.id)}
                      className="text-gray-600 hover:bg-gray-100 text-xs px-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
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
            onEditFaults={handleEditFaults}
            repairCountByDevice={repairCountByDevice}
            isStartingRepair={(repairId: string) => startingRepairId === repairId}
          />
        </CardContent>
      </Card>

      {/* Edit Faults Dialog */}
      <EditFaultsDialog
        open={editFaultsDialog.open}
        onOpenChange={(open) => setEditFaultsDialog({ ...editFaultsDialog, open })}
        deviceId={editFaultsDialog.deviceId}
        deviceInternalId={editFaultsDialog.deviceInternalId}
        onSuccess={handleEditFaultsSuccess}
      />

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

export default function RepairJobsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    }>
      <RepairJobsPageContent />
    </Suspense>
  )
} 