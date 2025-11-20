'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { REPAIR_TYPES, REPAIR_TYPE_LABELS } from '@/lib/constants'

interface RepairTypeFilterProps {
  selectedRepairTypes: string[]
  onToggle: (type: string) => void
}

export function RepairTypeFilter({
  selectedRepairTypes,
  onToggle
}: RepairTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Repair Type</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 w-full justify-between">
            {selectedRepairTypes.length === 0
              ? 'All Types'
              : `${selectedRepairTypes.length} selected`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-2">
          <div className="space-y-2">
            {Object.entries(REPAIR_TYPES).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                <Checkbox
                  id={`repair-${key}`}
                  checked={selectedRepairTypes.includes(value)}
                  onCheckedChange={() => onToggle(value)}
                />
                <Label htmlFor={`repair-${key}`} className="text-sm cursor-pointer flex-1">
                  {REPAIR_TYPE_LABELS[value] || value}
                </Label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

