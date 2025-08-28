'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type UserRole = 'admin' | 'general_manager' | 'ops_manager' | 'qc_controller' | 'technician_l1' | 'technician_l2' | 'technician_l3';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const roleOptions = [
  { value: 'admin' as UserRole, label: 'Admin & General Manager' },
  { value: 'ops_manager' as UserRole, label: 'Operations Manager' },
  { value: 'qc_controller' as UserRole, label: 'QC Controller' },
  { value: 'technician_l1' as UserRole, label: 'Technician L1' },
  { value: 'technician_l2' as UserRole, label: 'Technician L2' },
  { value: 'technician_l3' as UserRole, label: 'Technician L3' },
];

const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleChange }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">View as:</span>
      <Select value={selectedRole} onValueChange={onRoleChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          {roleOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RoleSelector;

