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
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ops_manager':
        return 'bg-red-100 text-red-800'
      case 'technician':
        return 'bg-blue-100 text-blue-800'
      case 'qc_controller':
        return 'bg-yellow-100 text-yellow-800'
      case 'data_entry':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  }

  return (
    <Badge className={getRoleColor(role)}>
      {getRoleLabel(role)}
    </Badge>
  )
}