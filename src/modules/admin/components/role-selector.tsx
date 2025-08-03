'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface RoleSelectorProps {
  value?: string
  onValueChange: (value: string) => void
}

interface RoleBadgeProps {
  role: string
}

const roleLabels: Record<string, string> = {
  data_entry: 'Data Entry',
  qc_controller: 'QC Controller', 
  technician: 'Technician',
  ops_manager: 'Operations Manager'
}

const roleColors: Record<string, string> = {
  data_entry: 'bg-blue-100 text-blue-800',
  qc_controller: 'bg-green-100 text-green-800',
  technician: 'bg-purple-100 text-purple-800', 
  ops_manager: 'bg-red-100 text-red-800'
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

export function RoleBadge({ role }: RoleBadgeProps) {
  const label = roleLabels[role] || role
  const colorClass = roleColors[role] || 'bg-gray-100 text-gray-800'
  
  return (
    <Badge className={colorClass}>
      {label}
    </Badge>
  )
}