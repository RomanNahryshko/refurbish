'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Wrench } from 'lucide-react'

// Available repair types based on MVP documentation
export const repairTypes = [
  { id: 'housing_change', label: 'Housing Change', level: 'L1' },
  { id: 'glass_change', label: 'Glass Change', level: 'L2' },
  { id: 'battery_change', label: 'Battery Change', level: 'L3' },
  { id: 'software_update', label: 'Software Update', level: 'L3' },
  { 
    id: 'other', 
    label: 'Other', 
    level: 'L3', 
    requiresDescription: true
  }
]

interface RepairTaskSelectorProps {
  title?: string
  description?: string
  selectedRepairs: string[]
  otherDescription: string
  onRepairToggle: (repairId: string) => void
  onOtherDescriptionChange: (description: string) => void
  showCard?: boolean
  className?: string
}

export function RepairTaskSelector({
  title = "Required Repairs",
  description = "Select the repair tasks that need to be created",
  selectedRepairs,
  otherDescription,
  onRepairToggle,
  onOtherDescriptionChange,
  showCard = true,
  className = ""
}: RepairTaskSelectorProps) {
  
  const content = (
    <div className={className}>
      {showCard && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={showCard ? "" : "p-0"}>
        {!showCard && title && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {title}
            </h3>
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
        )}
        
        <div className="space-y-3">       
         {repairTypes.map((repair) => (
            <div key={repair.id}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  id={repair.id}
                  checked={selectedRepairs.includes(repair.id)}
                  onChange={() => {
                    if (typeof onRepairToggle === 'function') {
                      onRepairToggle(repair.id)
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <Label htmlFor={repair.id} className="cursor-pointer flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{repair.label}</span>
                    <Badge variant="outline">{repair.level} Technician</Badge>
                  </div>
                </Label>
                {/* Visual indicator of selection */}
                <div className="text-xs text-gray-500">
                  {selectedRepairs.includes(repair.id) ? '✓ Selected' : '○ Not Selected'}
                </div>
              </div>
              {repair.requiresDescription && selectedRepairs.includes(repair.id) && (
                <div className="ml-10 mt-2">
                  <Textarea
                    placeholder="Describe the repair needed..."
                    value={otherDescription}
                    onChange={(e) => onOtherDescriptionChange(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </div>
  )

  if (showCard) {
    return <Card className="border-orange-200">{content}</Card>
  }

  return content
}