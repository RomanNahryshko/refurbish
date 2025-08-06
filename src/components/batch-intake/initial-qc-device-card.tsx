'use client'

import { useState } from 'react'
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
  CheckCircle
} from 'lucide-react'
import { RepairTaskSelector } from '@/components/common/repair-task-selector'

interface DrPhoneData {
  imei: string
  model: string
  brand: string
  serialNumber: string
  faults: string[]
}

interface InitialQCDeviceCardProps {
  device: DrPhoneData
  deviceIndex: number
  selectedRepairs: string[]
  otherDescription: string
  onRepairToggle: (repairId: string) => void
  onOtherDescriptionChange: (description: string) => void
  onCompleteQC: () => void
}

export function InitialQCDeviceCard({
  device,
  deviceIndex,
  selectedRepairs,
  otherDescription,
  onRepairToggle,
  onOtherDescriptionChange,
  onCompleteQC
}: InitialQCDeviceCardProps) {
  const [showRepairs, setShowRepairs] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [qcApproach, setQcApproach] = useState<'repairs' | 'grade' | ''>('')

  const handleCompleteQC = () => {
    if (!qcApproach) {
      alert('Please select either "Add Repairs" or "Assign Grade"')
      return
    }

    if (qcApproach === 'repairs' && selectedRepairs.length === 0) {
      alert('Please select at least one repair task')
      return
    }

    if (qcApproach === 'grade' && !selectedGrade) {
      alert('Please assign a grade')
      return
    }

    const message = qcApproach === 'repairs' 
      ? `Have you added all required repairs for this device?\n\nSelected repairs: ${selectedRepairs.join(', ')}`
      : `Have you assigned the correct grade for this device?\n\nAssigned grade: ${selectedGrade}`

    if (confirm(message)) {
      onCompleteQC()
    }
  }

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
            {device.faults.map((fault, faultIndex) => (
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
          <RadioGroup value={qcApproach} onValueChange={(value) => setQcApproach(value as 'repairs' | 'grade')} className="mt-2">
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
              onClick={() => setShowRepairs(!showRepairs)}
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

        {/* Grade Assignment Section */}
        {qcApproach === 'grade' && (
          <div className="border rounded-lg p-3 bg-green-50">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4" />
              <span className="font-medium">Assign Grade</span>
            </div>
            <RadioGroup value={selectedGrade} onValueChange={setSelectedGrade} className="grid grid-cols-3 gap-3">
              <div className="border rounded-lg p-3 cursor-pointer hover:bg-white">
                <RadioGroupItem value="A" id={`grade-a-${deviceIndex}`} className="sr-only" />
                <Label htmlFor={`grade-a-${deviceIndex}`} className="cursor-pointer">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">A</div>
                    <div className="text-xs">Best</div>
                  </div>
                </Label>
              </div>
              <div className="border rounded-lg p-3 cursor-pointer hover:bg-white">
                <RadioGroupItem value="B" id={`grade-b-${deviceIndex}`} className="sr-only" />
                <Label htmlFor={`grade-b-${deviceIndex}`} className="cursor-pointer">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">B</div>
                    <div className="text-xs">Good</div>
                  </div>
                </Label>
              </div>
              <div className="border rounded-lg p-3 cursor-pointer hover:bg-white">
                <RadioGroupItem value="C" id={`grade-c-${deviceIndex}`} className="sr-only" />
                <Label htmlFor={`grade-c-${deviceIndex}`} className="cursor-pointer">
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
            onClick={handleCompleteQC}
            disabled={!qcApproach}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete Initial QC
          </Button>
        </div>
      </div>
    </Card>
  )
}