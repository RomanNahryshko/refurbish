'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmationDialog } from '@/components/common/confirmation-dialog'
import { TechnicianSimulator } from '@/components/common/technician-simulator'
import { RepairJobListTable } from '@/components/repair-jobs/repair-job-list-table'

import { 
  Wrench,
  Search,
  Plus,
  Minus,
  X,
  AlertTriangle,
  Info
} from 'lucide-react'

import { mockRepairJobs, mockBatches } from '@/lib/mock-data'
import { usePartsQuery } from '@/modules/inventory/hooks/use-inventory'
import { recordPartsUsage } from '@/lib/api/inventory-client'
import { toast } from 'sonner'
import { DEFAULT_ITEMS_PER_PAGE } from '@/lib/constants'
import { RepairJob } from '@/types/mock-types'

// Mock technicians for simulation
const mockTechnicians = [
  { id: 'user-3', full_name: 'L1', role: 'technician', technician_level: 'L1' },
  { id: 'user-4', full_name: 'L2', role: 'technician', technician_level: 'L2' },
  { id: 'user-5', full_name: 'L3', role: 'technician', technician_level: 'L3' },
  { id: 'user-2', full_name: 'Ops', role: 'ops_manager', technician_level: null }
]

// Import configs from the table component
import { repairTypeConfig } from '@/components/repair-jobs/repair-job-list-table'

export default function RepairJobsPage() {
  const [currentUser, setCurrentUser] = useState(mockTechnicians[1]) // Default to L2 technician
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('available') // Default to available jobs
  const [currentPage, setCurrentPage] = useState(1)
  
  // Fetch real inventory data
  const { data: spareParts = [], isLoading: partsLoading } = usePartsQuery()
  
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

  // Validation for parts availability
  const validatePartsAvailability = () => {
    return partsRecording.parts.every(part => {
      const sparePart = spareParts.find(p => p.id === part.partId)
      return sparePart && sparePart.quantity_in_stock >= part.quantity
    })
  }
  
  const hasInsufficientParts = partsRecording.parts.some(part => {
    const sparePart = spareParts.find(p => p.id === part.partId)
    return !sparePart || sparePart.quantity_in_stock < part.quantity
  })

  // Filter repairs based on current filters and user permissions
  const filteredRepairs = mockRepairJobs.filter(repair => {
    const matchesSearch = !searchTerm || 
      repair.device_internal_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.device_model?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Check if current user can see this repair based on their level
    const userCanSeeRepair = currentUser.role === 'ops_manager' || // Ops can see all jobs
      (currentUser.technician_level && (
        repairTypeConfig[repair.repair_type as keyof typeof repairTypeConfig]?.level === currentUser.technician_level ||
        repairTypeConfig[repair.repair_type as keyof typeof repairTypeConfig]?.level === 'Any'
      ))
    
    const matchesLevel = levelFilter === 'all' || 
      repairTypeConfig[repair.repair_type as keyof typeof repairTypeConfig]?.level === levelFilter ||
      repairTypeConfig[repair.repair_type as keyof typeof repairTypeConfig]?.level === 'Any'
    
    const matchesType = typeFilter === 'all' || repair.repair_type === typeFilter
    
    // Enhanced status filtering for better workflow
    let matchesStatus = false
    switch (statusFilter) {
      case 'available':
        matchesStatus = repair.status === 'pending'
        break
      case 'my_active':
        matchesStatus = repair.status === 'in_progress' && repair.assigned_to === currentUser.id
        break
      case 'all_active':
        matchesStatus = repair.status === 'in_progress' && currentUser.role === 'ops_manager'
        break
      case 'history':
        matchesStatus = repair.status === 'completed'
        break
      case 'all':
        matchesStatus = true
        break
      default:
        matchesStatus = repair.status === statusFilter
    }
    
    return matchesSearch && userCanSeeRepair && matchesLevel && matchesType && matchesStatus
  })

  // Sort repairs by device_internal_id to group same device repairs together
  const sortedRepairs = [...filteredRepairs].sort((a, b) => {
    // First sort by device ID to group same devices
    const deviceCompare = (a.device_internal_id || '').localeCompare(b.device_internal_id || '')
    if (deviceCompare !== 0) return deviceCompare
    
    // Then by creation date within same device
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  // Find current user's active repair for banner
  const activeRepair = mockRepairJobs.find(repair => 
    repair.assigned_to === currentUser.id && repair.status === 'in_progress'
  )

  // Pagination calculations
  const totalResults = sortedRepairs.length
  const totalPages = Math.ceil(totalResults / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRepairs = sortedRepairs.slice(startIndex, endIndex)

  const handleStartRepair = (repair: RepairJob) => {
    setConfirmDialog({
      open: true,
      title: 'Start Repair',
      description: `Are you sure you want to start the ${repairTypeConfig[repair.repair_type as keyof typeof repairTypeConfig]?.label} repair for device ${repair.device_internal_id}?`,
      action: () => {
        // Update the repair in mockRepairJobs to trigger re-render
        const repairIndex = mockRepairJobs.findIndex(r => r.id === repair.id)
        if (repairIndex !== -1) {
          mockRepairJobs[repairIndex] = {
            ...mockRepairJobs[repairIndex],
            status: 'in_progress',
            assigned_to: currentUser.id,
            assigned_to_name: currentUser.full_name,
            assigned_at: new Date().toISOString()
          }
        }
        
        // Force re-render by toggling a state
        setConfirmDialog({ ...confirmDialog, open: false })
        // Trigger a re-render by updating search term to itself
        setSearchTerm(prev => prev === '' ? ' ' : '')
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
    const repair = mockRepairJobs.find(r => r.id === repairId)
    setConfirmDialog({
      open: true,
      title: 'Cancel Repair Job',
      description: `Are you sure you want to cancel this repair for Device ${repair?.device_internal_id}?\n\nThis action will:\n• Return the job to the repair queue\n• Allow other technicians to pick it up\n• Clear your assignment from this repair\n\nThis action should only be used if you cannot complete the repair (missing parts, equipment issues, etc.).`,
      action: () => {
        // Find and reset the repair
        const repairIndex = mockRepairJobs.findIndex(r => r.id === repairId)
        if (repairIndex !== -1) {
          mockRepairJobs[repairIndex] = {
            ...mockRepairJobs[repairIndex],
            status: 'pending',
            assigned_to: undefined,
            assigned_to_name: undefined,
            assigned_at: undefined
          }
        }
        
        setConfirmDialog({ ...confirmDialog, open: false })
        // Force re-render
        setSearchTerm(prev => prev === '' ? ' ' : '')
      }
    })
  }

  const submitCompleteRepair = async () => {
    if (!partsRecording.repairId) return
    
    // Validate parts availability first
    if (!validatePartsAvailability()) {
      toast.error('Cannot complete repair: insufficient parts in stock')
      return
    }
    
    try {
      const repairIndex = mockRepairJobs.findIndex(r => r.id === partsRecording.repairId)
      if (repairIndex === -1) {
        toast.error('Repair job not found')
        return
      }
      
      // Record parts usage if any parts were used
      if (partsRecording.parts.length > 0) {
        const partsUsed = partsRecording.parts.map(part => ({
          spare_part_id: part.partId,
          quantity_used: part.quantity,
          notes: partsRecording.notes || undefined
        }))
        
        // This will trigger DB triggers to automatically deduct stock
        await recordPartsUsage(partsRecording.repairId, partsUsed)
        
        toast.success(`Parts usage recorded: ${partsUsed.length} parts deducted from inventory`)
      }
      
      // Update the repair to completed (in real app, this would be an API call)
      const partsUsedForDisplay = partsRecording.parts.map(part => {
        const sparePart = spareParts.find(p => p.id === part.partId)
        return {
          spare_part_id: part.partId,
          part_name: sparePart?.name || 'Unknown Part',
          quantity_used: part.quantity
        }
      })
      
      mockRepairJobs[repairIndex] = {
        ...mockRepairJobs[repairIndex],
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_notes: partsRecording.notes || undefined,
        parts_used: partsUsedForDisplay.length > 0 ? partsUsedForDisplay : undefined
      }
      
      // Check if all repairs for this device are now completed
      const completedRepair = mockRepairJobs[repairIndex]
      const deviceId = completedRepair.device_id
      const allRepairsForDevice = mockRepairJobs.filter(r => r.device_id === deviceId)
      const allCompleted = allRepairsForDevice.every(r => r.status === 'completed')
      
      if (allCompleted) {
        console.log(`All repairs completed for device ${completedRepair.device_internal_id}. Ready for QC.`)
        // TODO: In real implementation, update device status to 'final_qc'
      }
      
      toast.success('Repair completed successfully!')
      
    } catch (error) {
      console.error('Error completing repair:', error)
      toast.error('Failed to complete repair. Please try again.')
      return
    }
    
    // Reset form
    setPartsRecording({
      repairId: null,
      parts: [],
      notes: ''
    })
    
    // Force re-render
    setSearchTerm(prev => prev === '' ? ' ' : '')
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
          className="h-9 pl-8"
        />
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="my_active">My Active</SelectItem>
            {currentUser.role === 'ops_manager' && (
              <SelectItem value="all_active">All Active</SelectItem>
            )}
            <SelectItem value="history">History</SelectItem>
            <SelectItem value="all">All Status</SelectItem>
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={handleFilterChange(setLevelFilter)}>
          <SelectTrigger className="h-9 w-[120px]">
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
          <SelectTrigger className="h-9 w-[140px]">
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
            setStatusFilter('pending')
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
        <TechnicianSimulator
          currentUser={currentUser}
          technicians={mockTechnicians}
          onUserChange={setCurrentUser}
        />
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
          <RepairJobListTable
            repairJobs={paginatedRepairs}
            allRepairJobs={mockRepairJobs}
            batches={mockBatches}
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={totalResults}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            renderFilters={renderFilters}
            currentUser={currentUser}
            onStartRepair={handleStartRepair}
            onCompleteRepair={handleCompleteRepair}
            onCancelRepair={handleCancelRepair}
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
                    {partsLoading ? (
                      <div className="p-2 text-sm text-gray-500">Loading parts...</div>
                    ) : (
                      <>
                        {spareParts
                          .filter(part => part.quantity_in_stock > 0) // Only show parts with stock
                          .filter(part => !partsRecording.parts.find(p => p.partId === part.id))
                          .map(part => (
                            <SelectItem key={part.id} value={part.id}>
                              {part.name} (Stock: {part.quantity_in_stock})
                              {part.quantity_in_stock <= (part.minimum_stock_level || 0) && (
                                <span className="text-red-500 ml-1">⚠️ Low</span>
                              )}
                            </SelectItem>
                          ))}
                        {spareParts.filter(part => part.quantity_in_stock > 0 && !partsRecording.parts.find(p => p.partId === part.id)).length === 0 && (
                          <div className="p-2 text-sm text-gray-500">
                            {spareParts.length === 0 ? "No parts available" : "All available parts already added"}
                          </div>
                        )}
                      </>
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
                      const isLowStock = sparePart && sparePart.quantity_in_stock <= (sparePart.minimum_stock_level || 0)
                      const willGoNegative = sparePart && (sparePart.quantity_in_stock - part.quantity) < 0
                      
                      return (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <span className="text-sm">{sparePart?.name}</span>
                            <div className="text-xs text-gray-500">
                              Available: {sparePart?.quantity_in_stock || 0}
                              {isLowStock && <span className="text-red-500 ml-1">⚠️ Low Stock</span>}
                              {willGoNegative && <span className="text-red-600 ml-1">❌ Insufficient Stock</span>}
                            </div>
                          </div>
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
                                const maxStock = sparePart?.quantity_in_stock || 0
                                if (newParts[index].quantity < maxStock) {
                                  newParts[index].quantity++
                                  setPartsRecording({ ...partsRecording, parts: newParts })
                                }
                              }}
                              disabled={part.quantity >= (sparePart?.quantity_in_stock || 0)}
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
              
              {/* Warning for insufficient parts */}
              {hasInsufficientParts && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">
                    Cannot complete repair: insufficient stock for selected parts
                  </span>
                </div>
              )}
              
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
                <Button 
                  onClick={submitCompleteRepair} 
                  className="flex-1"
                  disabled={hasInsufficientParts}
                >
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