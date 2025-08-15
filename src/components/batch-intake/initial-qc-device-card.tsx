'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  ChevronDown,
  ChevronUp,
  Wrench,
  Award,
  CheckCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { RepairTaskSelector } from '@/components/common/repair-task-selector'
import { useCreateQCCheck } from '@/lib/hooks/use-qc-checks'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Import repair types to get human-readable labels
import { repairTypes } from '@/components/common/repair-task-selector'

interface DrPhoneData {
  imei: string
  model: string
  brand: string
  serialNumber: string
  faults: string
}

interface InitialQCDeviceCardProps {
  device: DrPhoneData
  deviceIndex: number
  deviceId?: string // Add device ID for saving to database
  selectedRepairs: string[]
  otherDescription: string
  selectedGrade?: string // Add selected grade prop
  onRepairToggle: (repairId: string) => void
  onOtherDescriptionChange: (description: string) => void
  onGradeChange?: (grade: string) => void // Add grade change handler
  onCompleteQC?: () => void // Made optional since we have onCompleteQCWithDevice
  // New props for controlling repair section expansion
  isRepairSectionExpanded?: boolean
  onRepairSectionToggle?: () => void
  // New props for controlling QC approach
  qcApproach?: 'repairs' | 'grade' | ''
  onQcApproachChange?: (approach: 'repairs' | 'grade') => void
  // New prop for completing QC with device creation
  onCompleteQCWithDevice?: (deviceData: DrPhoneData, deviceIndex: number) => void
  // New prop for when QC is actually completed
  onQCCompleted?: () => void
  // New prop for when all operations are complete
  onAllOperationsComplete?: () => void
}

export function InitialQCDeviceCard({
  device,
  deviceIndex,
  deviceId,
  selectedRepairs,
  otherDescription,
  selectedGrade = '',
  onRepairToggle,
  onOtherDescriptionChange,
  onGradeChange,
  onCompleteQC,
  isRepairSectionExpanded = false,
  onRepairSectionToggle,
  qcApproach = '',
  onQcApproachChange,
  onCompleteQCWithDevice,
  onQCCompleted,
  onAllOperationsComplete
}: InitialQCDeviceCardProps) {
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  const createQCCheck = useCreateQCCheck()

  // Auto-save QC data when deviceId becomes available (only if we're in QC completion flow)
  const [qcDataReady, setQcDataReady] = useState(false)
  const [isProcessingComplete, setIsProcessingComplete] = useState(false)
  
  useEffect(() => {
    if (deviceId && qcApproach && qcDataReady && !isSubmitting) {
      // Save QC data immediately without going through confirmation dialog
      saveQCData(deviceId)
    }
  }, [deviceId, qcApproach, qcDataReady, isSubmitting])

  // Function to save QC data directly (without confirmation dialog)
  const saveQCData = async (deviceIdToUse: string) => {
    try {
      setIsSubmitting(true)
      setIsProcessingComplete(false)

      // Prepare QC data
      const qcData = {
        device_id: deviceIdToUse,
        check_type: 'initial' as const,
        // If repairs needed: overall_result = 'fail', device goes to repair
        // If grade assigned: overall_result = 'pass', device gets 'graded' status
        overall_result: qcApproach === 'repairs' ? 'fail' as const : 'pass' as const,
        grade_assigned: qcApproach === 'grade' ? selectedGrade as 'A' | 'B' | 'C' : undefined,
        notes: qcApproach === 'repairs' 
          ? `Initial QC: Repairs required. Selected repairs: ${selectedRepairs.map(getRepairLabel).join(', ')}${otherDescription ? ` Additional notes: ${otherDescription}` : ''}`
          : `Initial QC: Grade assigned. Grade: ${selectedGrade}`
      }

      // Save to database
      await createQCCheck.mutateAsync({
        qcData,
        testResults: undefined // We'll handle test results separately if needed
      })

      // Call the callback to update UI
      onCompleteQC?.()
      
      // Call the QC completed callback to mark device as completed
      onQCCompleted?.()
      
      // Call the callback to indicate all operations are complete
      onAllOperationsComplete?.()
      
      // Reset the ready state
      setQcDataReady(false)
      
      // Mark processing as complete
      setIsProcessingComplete(true)
    } catch {
      toast.error('Failed to save QC data. Please try again.')
      setIsProcessingComplete(true)
    } finally {
      // Only stop submitting if processing is complete
      if (isProcessingComplete) {
        setIsSubmitting(false)
      }
    }
  }

  // Helper function to convert repair IDs to human-readable labels
  const getRepairLabel = (repairId: string): string => {
    const repairType = repairTypes.find(repair => repair.id === repairId)
    return repairType ? repairType.label : repairId
  }


  const handleCompleteQC = () => {
    if (!qcApproach) {
      toast.error('Please select either "Add Repairs" or "Assign Grade"')
      return
    }

    if (qcApproach === 'repairs' && selectedRepairs.length === 0) {
      toast.error('Please select at least one repair task')
      return
    }

    if (qcApproach === 'grade' && !selectedGrade) {
      toast.error('Please assign a grade')
      return
    }

    // Show confirmation dialog
    setShowConfirmation(true)
  }

  const handleConfirmQC = useCallback(async () => {
    setShowConfirmation(false)
    setIsSubmitting(true)
    setIsProcessingComplete(false)

    try {
      // If no device ID is provided, try to create device first
      if (!deviceId) {
        if (onCompleteQCWithDevice) {
          // Set flag to indicate QC data is ready to be saved once device is created
          setQcDataReady(true)
          // Call the callback to create device first
          onCompleteQCWithDevice(device, deviceIndex)
          // Note: After device creation, the parent component will update the deviceId prop
          // and this component will re-render, allowing the QC check to be saved
          // Don't stop submitting here - wait for all operations to complete
          return
        } else {
          // Fallback to demo mode
          onCompleteQC?.()
          setIsProcessingComplete(true)
          setIsSubmitting(false)
          return
        }
      }

      // Prepare QC data
      const qcData = {
        device_id: deviceId,
        check_type: 'initial' as const,
        // If repairs needed: overall_result = 'fail', device goes to repair
        // If grade assigned: overall_result = 'pass', device gets 'graded' status
        overall_result: qcApproach === 'repairs' ? 'fail' as const : 'pass' as const,
        grade_assigned: qcApproach === 'grade' ? selectedGrade as 'A' | 'B' | 'C' : undefined,
        notes: qcApproach === 'repairs' 
          ? `Initial QC: Repairs required. Selected repairs: ${selectedRepairs.map(getRepairLabel).join(', ')}${otherDescription ? ` Additional notes: ${otherDescription}` : ''}`
          : `Initial QC: Grade assigned. Grade: ${selectedGrade}`
      }

      // Save to database
      await createQCCheck.mutateAsync({
        qcData,
        testResults: undefined // We'll handle test results separately if needed
      })

      // Call the callback to update UI
      onCompleteQC?.()
      
      // Call the QC completed callback to mark device as completed
      onQCCompleted?.()
      
      // Call the callback to indicate all operations are complete
      onAllOperationsComplete?.()
      
      // Mark processing as complete
      setIsProcessingComplete(true)
    } catch {
      toast.error('Failed to save QC data. Please try again.')
      setIsProcessingComplete(true)
    } finally {
      // Only stop submitting if processing is complete
      if (isProcessingComplete) {
        setIsSubmitting(false)
      }
    }
  }, [deviceId, qcApproach, selectedRepairs, otherDescription, onCompleteQCWithDevice, device, onCompleteQC, createQCCheck, getRepairLabel, onQCCompleted, onAllOperationsComplete])

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Device Information */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">IMEI:</span>
            <span className="font-mono">{device.imei}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Model:</span>
            <span>{device.brand} {device.model}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Serial:</span>
            <span className="font-mono text-sm">{device.serialNumber}</span>
          </div>
        </div>

        {/* Detected Faults (Read-only) */}
        <div>
          <span className="text-sm font-medium text-muted-foreground">Detected Faults (Software Check):</span>
          <div className="mt-2 space-y-1">
            {device.faults.split(',').map((fault: string, faultIndex: number) => (
              <Badge key={faultIndex} variant="secondary" className="mr-2">
                {fault}
              </Badge>
            ))}
            {device.faults.length === 0 && (
              <span className="text-sm text-muted-foreground">No faults detected</span>
            )}
          </div>
        </div>

        {/* Initial QC Decision */}
        <div className="border-t pt-3">
          <span className="text-sm font-medium text-muted-foreground">Initial QC Decision:</span>
          <RadioGroup value={qcApproach} onValueChange={(value) => onQcApproachChange?.(value as 'repairs' | 'grade')} className="mt-2">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="repairs" id={`repairs-${deviceIndex}`} />
                <Label htmlFor={`repairs-${deviceIndex}`} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    <span>Add Required Repairs</span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="grade" id={`grade-${deviceIndex}`} />
                <Label htmlFor={`grade-${deviceIndex}`} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>Assign Final Grade (No Repairs Needed)</span>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Required Repairs Section */}
        {qcApproach === 'repairs' && (
          <div className="border rounded-lg p-3 bg-orange-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRepairSectionToggle?.()}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Required Repairs
                {selectedRepairs.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {selectedRepairs.length} selected
                  </Badge>
                )}
              </span>
              {isRepairSectionExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            {isRepairSectionExpanded && (
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

        {/* Grade Assignment Section */}
        {qcApproach === 'grade' && (
          <div className="border rounded-lg p-3 bg-green-50">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4" />
              <span className="font-medium">Assign Grade</span>
            </div>
            <RadioGroup value={selectedGrade} onValueChange={onGradeChange} className="grid grid-cols-3 gap-3">
              <div className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedGrade === 'A' 
                  ? 'border-green-500 bg-green-100 shadow-md' 
                  : 'hover:bg-white hover:border-green-300'
              }`}>
                <RadioGroupItem value="A" id={`grade-a-${deviceIndex}`} className="sr-only" />
                <Label htmlFor={`grade-a-${deviceIndex}`} className="cursor-pointer w-full">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">A</div>
                    <div className="text-xs">Best</div>
                  </div>
                </Label>
              </div>
              <div className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedGrade === 'B' 
                  ? 'border-blue-500 bg-blue-100 shadow-md' 
                  : 'hover:bg-white hover:border-blue-300'
              }`}>
                <RadioGroupItem value="B" id={`grade-b-${deviceIndex}`} className="sr-only" />
                <Label htmlFor={`grade-b-${deviceIndex}`} className="cursor-pointer w-full">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">B</div>
                    <div className="text-xs">Good</div>
                  </div>
                </Label>
              </div>
              <div className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedGrade === 'C' 
                  ? 'border-orange-500 bg-orange-100 shadow-md' 
                  : 'hover:bg-white hover:border-orange-300'
              }`}>
                <RadioGroupItem value="C" id={`grade-c-${deviceIndex}`} className="sr-only" />
                <Label htmlFor={`grade-c-${deviceIndex}`} className="cursor-pointer w-full">
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600">C</div>
                    <div className="text-xs">Acceptable</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Complete QC Button */}
        <div className="flex justify-end pt-3 border-t">
          <Button 
            onClick={() => {
              handleCompleteQC()
            }}
            disabled={!qcApproach || isSubmitting || createQCCheck.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting || createQCCheck.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSubmitting ? 'Processing...' : 'Saving...'}
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Initial QC
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={(open) => {
        setShowConfirmation(open)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Initial QC
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                {qcApproach === 'repairs' ? (
                  <>
                    <p>You are about to complete Initial QC with the following repairs:</p>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <ul className="list-disc list-inside space-y-1">
                        {selectedRepairs.map((repair, index) => (
                          <li key={index} className="text-sm">{getRepairLabel(repair)}</li>
                        ))}
                      </ul>
                      {otherDescription && (
                        <p className="mt-2 text-sm"><strong>Additional notes:</strong> {otherDescription}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p>You are about to complete Initial QC with the following grade:</p>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className={`text-2xl font-bold ${
                        selectedGrade === 'A' ? 'text-green-600' : 
                        selectedGrade === 'B' ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        Grade {selectedGrade}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedGrade === 'A' ? 'Best' : selectedGrade === 'B' ? 'Good' : 'Acceptable'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                handleConfirmQC()
              }}
              disabled={isSubmitting || createQCCheck.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting || createQCCheck.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSubmitting ? 'Processing...' : 'Saving...'}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm & Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}