'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, User, Settings, Wrench } from 'lucide-react'

interface TechnicianUser {
  id: string
  full_name: string
  role: string
  technician_level: string | null
}

interface TechnicianSimulatorProps {
  currentUser: TechnicianUser
  technicians: TechnicianUser[]
  onUserChange: (user: TechnicianUser) => void
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'technician':
      return Wrench
    case 'ops_manager':
      return Settings
    default:
      return User
  }
}

const getRoleDisplay = (role: string) => {
  switch (role) {
    case 'technician':
      return 'Technician'
    case 'ops_manager':
      return 'Ops Manager'
    default:
      return role
  }
}

const getRepairTypes = (technicianLevel: string | null) => {
  switch (technicianLevel) {
    case 'L1':
      return 'L1 Jobs'
    case 'L2':
      return 'L2 Jobs'
    case 'L3':
      return 'L3 Jobs'
    default:
      return 'All Jobs'
  }
}

export function TechnicianSimulator({ currentUser, technicians, onUserChange }: TechnicianSimulatorProps) {
  const RoleIcon = getRoleIcon(currentUser.role)

  return (
    <div className="flex flex-col items-end space-y-1">
      <div className="text-xs text-gray-500">Simulating User:</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-auto p-2 flex items-center gap-2">
            <RoleIcon className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="font-medium">{currentUser.full_name}</span>
              <span className="text-xs text-gray-600">
                {getRepairTypes(currentUser.technician_level)}
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Switch User</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {technicians.map((user) => {
            const UserIcon = getRoleIcon(user.role)
            const isActive = user.id === currentUser.id
            
            return (
              <DropdownMenuItem
                key={user.id}
                onClick={() => onUserChange(user)}
                className={`cursor-pointer ${isActive ? 'bg-accent' : ''}`}
              >
                                  <div className="flex items-center gap-2 w-full">
                    <UserIcon className="h-4 w-4" />
                    <div className="flex-1">
                      <span className="font-medium">{user.full_name}</span>
                      <div className="text-xs text-gray-600">
                        {getRepairTypes(user.technician_level)}
                      </div>
                    </div>
                  </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
