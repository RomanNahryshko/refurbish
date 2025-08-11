'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmationDialog } from '@/components/common/confirmation-dialog'

import { 
  Wrench,
  Search,
  Eye,
  ClipboardCheck,
  Clock,
  User,
  Smartphone,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

import { mockRepairJobs, mockSpareParts, mockDevices, mockBatches } from '@/lib/mock-data'

// Mock current user (for MVP - simulates logged in technician)
const mockCurrentUser = {
  id: 'user-tech-1',
  full_name: 'Current Technician',
  role: 'technician',
  technician_level: 'L2' // L1 (Housing), L2 (Glass), L3 (Battery + Others)
}

const repairTypeConfig = {
  'housing_change': { label: 'Housing Change', level: 'L1', icon: Package },
  'glass_change': { label: 'Glass Change', level: 'L2', icon: AlertCircle },
  'battery_change': { label: 'Battery Change', level: 'L3', icon: Package },
  'software_update': { label: 'Software Update', level: 'Any', icon: CheckCircle },
  'other': { label: 'Other Repair', level: 'Any', icon: Wrench }
}

const statusConfig = {
  'pending': { label: 'Pending', variant: 'outline' as const, icon: Clock },
  'in_progress': { label: 'In Progress', variant: 'secondary' as const, icon: User },
  'completed': { label: 'Completed', variant: 'default' as const, icon: CheckCircle }
}

export default function RepairJobsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('pending')
  
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
    selectedPart: string
    quantity: number
    notes: string
  }>({
    repairId: null,
    selectedPart: '',
    quantity: 1,
    notes: ''
  })

  // Filter repairs based on current filters
  const filteredRepairs = mockRepairJobs.filter(repair => {
    const matchesSearch = !searchTerm || 
      repair.device_internal_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.device_model?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLevel = levelFilter === 'all' || 
      repairTypeConfig[repair.repair_type as keyof typeof repairTypeConfig]?.level === levelFilter ||
      repairTypeConfig[repair.repair_type as keyof typeof repairTypeConfig]?.level === 'Any'
    
    const matchesType = typeFilter === 'all' || repair.repair_type === typeFilter
    const matchesStatus = statusFilter === 'all' || repair.status === statusFilter
    
    return matchesSearch && matchesLevel && matchesType && matchesStatus
  })

  const handleStartRepair = (repair: any) => {
    setConfirmDialog({
      open: true,
      title: 'Start Repair',
      description: `Are you sure you want to start the ${repairTypeConfig[repair.repair_type as keyof typeof repairTypeConfig]?.label} repair for device ${repair.device_internal_id}?`,
      action: () => {
        // In real app, this would update the database
        console.log('Starting repair:', repair.id)
        repair.status = 'in_progress'
        repair.assigned_to = mockCurrentUser.id
        repair.assigned_to_name = mockCurrentUser.full_name
        repair.assigned_at = new Date().toISOString()
        setConfirmDialog({ ...confirmDialog, open: false })
      }
    })
  }

  const handleCompleteRepair = (repairId: string) => {
    setPartsRecording({
      repairId,
      selectedPart: '',
      quantity: 1,
      notes: ''
    })
  }

  const submitCompleteRepair = () => {
    const repair = mockRepairJobs.find(r => r.id === partsRecording.repairId)
    if (repair) {
      repair.status = 'completed'
      repair.completed_at = new Date().toISOString()
      repair.completion_notes = partsRecording.notes || undefined
      
      if (partsRecording.selectedPart) {
        const selectedPart = mockSpareParts.find(p => p.id === partsRecording.selectedPart)
        repair.parts_used = [{
          spare_part_id: partsRecording.selectedPart,
          part_name: selectedPart?.name || 'Unknown Part',
          quantity_used: partsRecording.quantity
        }]
      }
      
      console.log('Completed repair:', repair.id)
    }
    
    setPartsRecording({
      repairId: null,
      selectedPart: '',
      quantity: 1,
      notes: ''
    })
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
        <div className="text-sm text-gray-600">
          Current User: <span className="font-medium">{mockCurrentUser.full_name}</span> 
          <Badge variant="outline" className="ml-2">{mockCurrentUser.technician_level}</Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search IMEI / Internal ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-8"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
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

            <Select value={typeFilter} onValueChange={setTypeFilter}>
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
              }}
              className="h-9"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Repair Jobs Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Available Repairs ({filteredRepairs.length} jobs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRepairs.length > 0 ? (
            <div className="space-y-4">
              {filteredRepairs.map((repair) => {
                const repairConfig = repairTypeConfig[repair.repair_type as keyof typeof repairTypeConfig]
                const statusInfo = statusConfig[repair.status as keyof typeof statusConfig]
                const RepairIcon = repairConfig?.icon || Wrench
                const StatusIcon = statusInfo?.icon || Clock
                
                return (
                  <div key={repair.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded">
                          <RepairIcon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {repairConfig?.label}
                            <Badge variant="outline">{repairConfig?.level}</Badge>
                          </h4>
                          <p className="text-sm text-gray-600">
                            <Smartphone className="inline h-3 w-3 mr-1" />
                            {repair.device_model} • {repair.device_internal_id}
                          </p>
                          {repair.assigned_to_name && (
                            <p className="text-sm text-gray-600">
                              <User className="inline h-3 w-3 mr-1" />
                              Assigned to {repair.assigned_to_name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={statusInfo?.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo?.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Created: {new Date(repair.created_at).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link href={`/devices/${repair.device_internal_id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Device
                          </Button>
                        </Link>
                        
                        {repair.status === 'pending' && (
                          <Button 
                            size="sm"
                            onClick={() => handleStartRepair(repair)}
                            className="cursor-pointer"
                          >
                            <ClipboardCheck className="h-4 w-4 mr-1" />
                            Start Repair
                          </Button>
                        )}
                        
                        {repair.status === 'in_progress' && repair.assigned_to === mockCurrentUser.id && (
                          <Button 
                            size="sm"
                            onClick={() => handleCompleteRepair(repair.id)}
                            className="cursor-pointer"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No repairs found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more repair jobs.</p>
            </div>
          )}
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
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Complete Repair</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Parts Used (Optional)</label>
                <Select value={partsRecording.selectedPart} onValueChange={(value) => 
                  setPartsRecording({ ...partsRecording, selectedPart: value })
                }>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select part" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No parts used</SelectItem>
                    {mockSpareParts.map(part => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.name} (Stock: {part.quantity_in_stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {partsRecording.selectedPart && (
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={partsRecording.quantity}
                    onChange={(e) => setPartsRecording({ 
                      ...partsRecording, 
                      quantity: parseInt(e.target.value) || 1 
                    })}
                    className="mt-1"
                  />
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
                    selectedPart: '', 
                    quantity: 1, 
                    notes: '' 
                  })}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={submitCompleteRepair} className="flex-1">
                  Complete Repair
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 