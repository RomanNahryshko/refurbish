'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmationDialog } from '@/components/common/confirmation-dialog'


import { 
  ArrowLeft,
  Smartphone,
  Package,
  Wrench,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Hash,
  ClipboardCheck,
  Package2
} from 'lucide-react'
import { mockDevices, mockBatches, mockRepairJobs, mockQCChecks, mockUsers, mockSpareParts, getDeviceByInternalId } from '@/lib/mock-data'
import { statusConfig } from '@/components/common/device-list-table'

// Mock current user (for role-based actions)
const mockCurrentUser = {
  id: 'user-current',
  full_name: 'Current User',
  role: 'technician', // or 'ops_manager'
  technician_level: 'L2'
}

export default function DeviceJobSheetPage() {
  const params = useParams()
  const router = useRouter()
  const internalId = params.internalId as string
  
  // State for parts recording
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
  
  // State for confirmation dialogs
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
  
  // Validate internal ID format (8 digits)
  if (!/^\d{8}$/.test(internalId)) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Device ID</h1>
          <p className="text-gray-600 mt-2">Device ID must be 8 digits: {internalId}</p>
          <Link href="/devices" className="mt-4 inline-block">
            <Button>Back to Devices</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  const device = getDeviceByInternalId(internalId)
  const batch = device ? mockBatches.find(b => b.id === device.batch_id) : null
  const repairs = device ? mockRepairJobs.filter(r => r.device_id === device.id) : []
  const qcChecks = device ? mockQCChecks.filter(q => q.device_id === device.id) : []
  


  if (!device) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-gray-600">Device not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusConfig[device.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  // Handler functions for parts recording and repair actions
  const handleAddPartsToRepair = (repairId: string) => {
    setPartsRecording({
      repairId,
      selectedPart: '',
      quantity: 1,
      notes: ''
    })
  }

  const submitPartsRecord = () => {
    const repair = mockRepairJobs.find(r => r.id === partsRecording.repairId)
    if (repair && partsRecording.selectedPart) {
      const selectedPart = mockSpareParts.find(p => p.id === partsRecording.selectedPart)
      
      if (!repair.parts_used) {
        repair.parts_used = []
      }
      
      repair.parts_used.push({
        spare_part_id: partsRecording.selectedPart,
        part_name: selectedPart?.name || 'Unknown Part',
        quantity_used: partsRecording.quantity
      })
      
      console.log('Added parts to repair:', repair.id, partsRecording)
    }
    
    setPartsRecording({
      repairId: null,
      selectedPart: '',
      quantity: 1,
      notes: ''
    })
  }

  const handleCreateRepair = (repairType: string) => {
    setConfirmDialog({
      open: true,
      title: 'Create Repair Job',
      description: `Create a new ${repairType.replace('_', ' ')} repair for this device?`,
      action: () => {
        const newRepair = {
          id: `repair-new-${Date.now()}`,
          device_id: device.id,
          device_internal_id: device.internal_id,
          device_model: `${device.brand} ${device.model}`,
          repair_type: repairType as 'housing_change' | 'glass_change' | 'battery_change' | 'software_update' | 'other',
          description: undefined,
          status: 'pending' as const,
          assigned_to: undefined,
          assigned_to_name: undefined,
          created_at: new Date().toISOString()
        }
        
        mockRepairJobs.push(newRepair)
        console.log('Created new repair:', newRepair)
        setConfirmDialog({ ...confirmDialog, open: false })
      }
    })
  }



  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/devices">
            <Button variant="ghost" size="sm" className="cursor-pointer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Devices
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Smartphone className="h-6 w-6" />
              Device Job Sheet
            </h1>
            <p className="text-gray-600">Internal ID: {device.internal_id}</p>
          </div>
        </div>
        
        <div>
          <Link href="/repair-jobs">
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Wrench className="mr-2 h-4 w-4" />
              Repair Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Current Device Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg py-2 px-4">
              <StatusIcon className="mr-2 h-5 w-5" />
              {status.label}
            </Badge>
            <span className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Device Information Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Device Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Brand & Model</span>
                <p className="font-medium">{device.brand} {device.model}</p>
              </div>
              <div>
                <span className="text-gray-600">Color & Storage</span>
                <p className="font-medium">{device.color} • {device.storage_capacity}</p>
              </div>
              <div>
                <span className="text-gray-600">Grade</span>
                <p className="font-medium">
                  {device.grade && device.grade !== 'ungraded' ? (
                    <Badge variant="outline">Grade {device.grade}</Badge>
                  ) : (
                    <span className="text-gray-400">Not graded</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-600 flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Internal ID
                </span>
                <p className="font-mono font-medium">{device.internal_id}</p>
              </div>
              <div>
                <span className="text-gray-600">IMEI</span>
                <p className="font-mono text-xs">{device.imei || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Serial Number</span>
                <p className="font-mono text-xs">{device.serial_number || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Batch & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-gray-600 text-sm">Batch</span>
              <div className="mt-1">
                <Link href={`/batch-intake/${batch?.id}`}>
                  <Badge variant="outline" className="cursor-pointer">
                    {batch?.batch_number || 'N/A'}
                  </Badge>
                </Link>
              </div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Received Date</span>
              <p className="text-sm">{new Date(device.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repair History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Repair History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {repairs.length > 0 ? (
            <div className="space-y-4">
              {repairs.map((repair) => {
                const technician = mockUsers.find(u => u.id === repair.assigned_to)
                return (
                  <div key={repair.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">
                          {repair.repair_type.split('_').map(w => 
                            w.charAt(0).toUpperCase() + w.slice(1)
                          ).join(' ')} Repair
                        </h4>
                        <p className="text-sm text-gray-600">
                          Assigned to {technician?.full_name}
                        </p>
                      </div>
                      <Badge variant={
                        repair.status === 'completed' ? 'default' :
                        repair.status === 'in_progress' ? 'secondary' :
                        'outline'
                      }>
                        {repair.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Created</span>
                        <p>{new Date(repair.created_at).toLocaleDateString()}</p>
                      </div>
                      {repair.assigned_at && (
                        <div>
                          <span className="text-gray-600">Assigned</span>
                          <p>{new Date(repair.assigned_at).toLocaleDateString()}</p>
                        </div>
                      )}
                      {repair.completed_at && (
                        <div>
                          <span className="text-gray-600">Completed</span>
                          <p>{new Date(repair.completed_at).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {repair.parts_used && repair.parts_used.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium mb-1">Parts Used:</p>
                        <ul className="text-sm text-gray-600">
                          {repair.parts_used.map((part, idx) => (
                            <li key={idx}>• {part.part_name} (Qty: {part.quantity_used})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {repair.completion_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm">{repair.completion_notes}</p>
                      </div>
                    )}
                    
                    {/* Action buttons for repairs */}
                    {(mockCurrentUser.role === 'technician' || mockCurrentUser.role === 'ops_manager') && (
                      <div className="mt-3 flex gap-2">
                        {(repair.status === 'completed' || repair.status === 'in_progress') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddPartsToRepair(repair.id)}
                            className="cursor-pointer"
                          >
                            <Package className="h-4 w-4 mr-1" />
                            Add Parts
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Wrench className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <p className="text-gray-600">No repairs scheduled for this device</p>
            </div>
          )}
          
          {/* Create New Repair - Only for Ops Managers */}
          {mockCurrentUser.role === 'ops_manager' && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">Create New Repair Job</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateRepair('housing_change')}
                  className="cursor-pointer"
                >
                  <Package className="h-4 w-4 mr-1" />
                  Housing Change (L1)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateRepair('glass_change')}
                  className="cursor-pointer"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Glass Change (L2)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateRepair('battery_change')}
                  className="cursor-pointer"
                >
                  <Package2 className="h-4 w-4 mr-1" />
                  Battery Change (L3)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateRepair('software_update')}
                  className="cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Software Update
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateRepair('other')}
                  className="cursor-pointer"
                >
                  <Wrench className="h-4 w-4 mr-1" />
                  Other Repair
                </Button>
              </div>
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
        confirmText="Create"
        onConfirm={confirmDialog.action}
      />

      {/* Parts Recording Dialog */}
      {partsRecording.repairId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add Parts to Repair</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Part</label>
                <Select value={partsRecording.selectedPart} onValueChange={(value) => 
                  setPartsRecording({ ...partsRecording, selectedPart: value })
                }>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a part" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSpareParts.map(part => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.name} (Stock: {part.quantity_in_stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
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
              
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Input
                  placeholder="Usage notes..."
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
                <Button 
                  onClick={submitPartsRecord} 
                  className="flex-1"
                  disabled={!partsRecording.selectedPart}
                >
                  Add Parts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}