'use client';

import React from 'react';

export type UserRole = 'admin' | 'general_manager' | 'ops_manager' | 'qc_controller' | 'technician_l1' | 'technician_l2' | 'technician_l3';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleChange }) => {
  // Always set role to admin and don't show selector
  React.useEffect(() => {
    if (selectedRole !== 'admin') {
      onRoleChange('admin');
    }
  }, [selectedRole, onRoleChange]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Dashboard:</span>
      <span className="text-sm font-semibold text-primary">Admin & General Manager</span>
    </div>
  );
};

export default RoleSelector;

