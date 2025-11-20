'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { Technician } from '@/lib/types/device-refurbishing-report'

interface TechnicianFilterProps {
  technicians: Technician[]
  selectedTechnicians: string[]
  onToggle: (id: string) => void
}

export function TechnicianFilter({
  technicians,
  selectedTechnicians,
  onToggle
}: TechnicianFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Technician(s)</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 w-full justify-between">
            {selectedTechnicians.length === 0
              ? 'All Technicians'
              : `${selectedTechnicians.length} selected`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-2">
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {technicians.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2">
                No technicians found
              </div>
            ) : (
              technicians.map(tech => (
                <div key={tech.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                  <Checkbox
                    id={`tech-${tech.id}`}
                    checked={selectedTechnicians.includes(tech.id)}
                    onCheckedChange={() => onToggle(tech.id)}
                  />
                  <Label
                    htmlFor={`tech-${tech.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {tech.full_name} {tech.technician_level && `(${tech.technician_level})`}
                  </Label>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

