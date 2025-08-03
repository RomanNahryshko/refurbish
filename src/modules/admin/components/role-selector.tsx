'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface RoleSelectorProps {
  value?: string
  onValueChange: (value: string) => void
}

export function RoleSelector({ value, onValueChange }: RoleSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="data_entry">Data Entry</SelectItem>
        <SelectItem value="qc_controller">QC Controller</SelectItem>
        <SelectItem value="technician">Technician</SelectItem>
        <SelectItem value="ops_manager">Operations Manager</SelectItem>
      </SelectContent>
    </Select>
  )
}