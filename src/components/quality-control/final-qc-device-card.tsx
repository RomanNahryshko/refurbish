'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ChevronDown,
  ChevronUp,
  Wrench,
  Award,
  CheckCircle,
  XCircle,
  Package,
  Calendar
} from 'lucide-react'
import { RepairTaskSelector } from '@/components/common/repair-task-selector'
import { ConfirmationDialog } from '@/components/common/confirmation-dialog'

interface Device {
  id: string
  internal_id: string
  batch_id: string
  imei?: string
  serial_number?: string
  brand?: string
  model?: string
  color?: string
  storage_capacity?: string
  status: string
  grade: string
  created_at: string
}

interface RepairJob {
  id: string
  device_id: string
  repair_type: string
  status: string
  completion_notes?: string
  completed_at?: string
  created_at: string
}

interface Batch {
  id: string
  batch_number: string
}

interface FinalQCDeviceCardProps {
  device: Device
  batch?: Batch
  completedRepairs: RepairJob[]
  selectedRepairs: string[]
  otherDescription: string
  qcNotes: string
  onRepairToggle: (repairId: string) => void
  onOtherDescriptionChange: (description: string) => void
  onQCNotesChange: (notes: string) => void
  onCompleteQC: (decision: 'pass' | 'fail', grade?: string) => Promise<void>
  isSubmitting?: boolean
}

export function FinalQCDeviceCard({
  device,
  batch,
  completedRepairs,
  selectedRepairs,
  otherDescription,
  qcNotes,
  onRepairToggle,
  onOtherDescriptionChange,
  onQCNotesChange,
  onCompleteQC,
  isSubmitting = false
}: FinalQCDeviceCardProps) {
  const [showRepairs, setShowRepairs] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [qcDecision, setQcDecision] = useState<'pass' | 'fail' | ''>('')
  
  // Modal states
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean
    title: string
    description: string
  }>({
    open: false,
    title: '',
    description: ''
  })
  
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

  const handleCompleteQC = () => {
    if (!qcDecision) {
      setErrorDialog({
        open: true,
        title: 'Missing QC Decision',
        description: 'Please select Pass or Fail QC before proceeding.'
      })
      return
    }

    if (qcDecision === 'pass' && !selectedGrade) {
      setErrorDialog({
        open: true,
        title: 'Missing Grade Assignment',
        description: 'Please assign a grade for the passed device.'
      })
      return
    }

    if (qcDecision === 'fail' && selectedRepairs.length === 0) {
      setErrorDialog({
        open: true,
        title: 'Missing Repair Tasks',
        description: 'Please select at least one repair task for the failed device.'
      })
      return
    }

    const title = qcDecision === 'pass' 
      ? 'Confirm Pass Final QC'
      : 'Confirm Fail Final QC'
    
    const description = qcDecision === 'pass' 
      ? `Are you sure you want to pass Final QC with Grade ${selectedGrade}?\n\nDevice will be marked as ready to ship.`
      : `Are you sure you want to fail Final QC and send back for repairs?\n\nSelected repairs: ${selectedRepairs.join(', ')}`

    setConfirmDialog({
      open: true,
      title,
      description,
      action: () => {
        onCompleteQC(qcDecision, selectedGrade)
        setConfirmDialog({ open: false, title: '', description: '', action: () => {} })
      }
    })
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Device Information */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Internal ID:</span>
            <span className="font-mono font-semibold">{device.internal_id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Model:</span>
            <span>{device.brand} {device.model}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">IMEI:</span>
            <span className="font-mono text-sm">{device.imei}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Current Grade:</span>
            <Badge variant="outline">{device.grade === 'ungraded' ? 'Ungraded' : device.grade}</Badge>
          </div>
        </div>

        {/* Additional Device Details */}
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-muted-foreground">Batch:</span>
            <span>{batch?.batch_number || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Storage:</span>
            <span>{device.storage_capacity || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Color:</span>
            <span>{device.color || 'Unknown'}</span>
          </div>
        </div>

        {/* Completed Repairs */}
        <div>
          <span className="text-sm font-medium text-muted-foreground">Completed Repairs:</span>
          <div className="mt-2 space-y-2">
            {completedRepairs.length > 0 ? (
              completedRepairs.map((repair) => (
                <div key={repair.id} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      {repair.repair_type.split('_').map(w => 
                        w.charAt(0).toUpperCase() + w.slice(1)
                      ).join(' ')}
                    </span>
                    {repair.completion_notes && (
                      <span className="text-sm text-gray-600">- {repair.completion_notes}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(repair.completed_at || repair.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-2 bg-gray-50 border rounded text-sm text-gray-600">
                No repairs were performed on this device
              </div>
            )}
          </div>
        </div>

        {/* QC Notes */}
        <div>
          <Label htmlFor="qc-notes" className="text-sm font-medium">QC Notes</Label>
          <Textarea
            id="qc-notes"
            placeholder="Add any observations from manual inspection..."
            value={qcNotes}
            onChange={(e) => onQCNotesChange(e.target.value)}
            rows={3}
            className="mt-2"
          />
        </div>

        {/* Final QC Decision */}
        <div className="border-t pt-3">
          <span className="text-sm font-medium text-muted-foreground">Final QC Decision:</span>
          <RadioGroup value={qcDecision} onValueChange={(value) => setQcDecision(value as 'pass' | 'fail')} className="mt-2">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="pass" id="qc-pass" />
                <Label htmlFor="qc-pass" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Pass QC - Assign Final Grade</span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="fail" id="qc-fail" />
                <Label htmlFor="qc-fail" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Fail QC - Send Back for Additional Repairs</span>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Grade Assignment (shown when Pass is selected) */}
        {qcDecision === 'pass' && (
          <div className="border rounded-lg p-3 bg-green-50">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4" />
              <span className="font-medium">Assign Final Grade</span>
            </div>
            <RadioGroup value={selectedGrade} onValueChange={setSelectedGrade} className="grid grid-cols-3 gap-3">
              <div className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedGrade === 'A' 
                  ? 'border-green-500 bg-green-100 shadow-md' 
                  : 'hover:bg-white hover:border-green-300'
              }`}>
                <RadioGroupItem value="A" id="final-grade-a" className="sr-only" />
                <Label htmlFor="final-grade-a" className="cursor-pointer w-full">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">A</div>
                    <div className="text-xs">Best Condition</div>
                  </div>
                </Label>
              </div>
              <div className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedGrade === 'B' 
                  ? 'border-blue-500 bg-blue-100 shadow-md' 
                  : 'hover:bg-white hover:border-blue-300'
              }`}>
                <RadioGroupItem value="B" id="final-grade-b" className="sr-only" />
                <Label htmlFor="final-grade-b" className="cursor-pointer w-full">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">B</div>
                    <div className="text-xs">Good Condition</div>
                  </div>
                </Label>
              </div>
              <div className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedGrade === 'C' 
                  ? 'border-orange-500 bg-orange-100 shadow-md' 
                  : 'hover:bg-white hover:border-orange-300'
              }`}>
                <RadioGroupItem value="C" id="final-grade-c" className="sr-only" />
                <Label htmlFor="final-grade-c" className="cursor-pointer w-full">
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600">C</div>
                    <div className="text-xs">Acceptable</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Additional Repairs (shown when Fail is selected) */}
        {qcDecision === 'fail' && (
          <div className="border rounded-lg p-3 bg-red-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRepairs(!showRepairs)}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Additional Repairs Required
                {selectedRepairs.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {selectedRepairs.length} selected
                  </Badge>
                )}
              </span>
              {showRepairs ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            {showRepairs && (
              <div className="mt-3">
                <RepairTaskSelector
                  title=""
                  description=""
                  selectedRepairs={selectedRepairs}
                  otherDescription={otherDescription}
                  onRepairToggle={onRepairToggle}
                  onOtherDescriptionChange={onOtherDescriptionChange}
                  showCard={false}
                  className="pl-4"
                />
              </div>
            )}
          </div>
        )}

        {/* Complete QC Button */}
        <div className="flex justify-end pt-3 border-t">
          <Button 
            onClick={handleCompleteQC}
            disabled={!qcDecision || isSubmitting}
            className={qcDecision === 'pass' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : qcDecision === 'pass' ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Final QC - Pass
              </>
            ) : qcDecision === 'fail' ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Complete Final QC - Fail
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Final QC
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Dialog */}
      <ConfirmationDialog
        open={errorDialog.open}
        onOpenChange={(open: boolean) => setErrorDialog({ ...errorDialog, open })}
        title={errorDialog.title}
        description={errorDialog.description}
        confirmText="OK"
        onConfirm={() => setErrorDialog({ open: false, title: '', description: '' })}
        onCancel={() => setErrorDialog({ open: false, title: '', description: '' })}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open: boolean) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Confirm"
        onConfirm={confirmDialog.action}
      />
    </Card>
  )
}