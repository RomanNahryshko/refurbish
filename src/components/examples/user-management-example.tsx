'use client'

import { useState } from 'react'
import { useUsers, useCreateUser, useUpdateUserStatus } from '@/lib/hooks/use-users'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/loading-spinner'

/**
 * Example component showing how to use user management hooks
 * This demonstrates the API functionality built in Phase 3
 */
export function UserManagementExample() {
  const [selectedRole, setSelectedRole] = useState<string>('')
  
  // Fetch users with optional role filter
  const { data: users, isLoading, error } = useUsers(
    selectedRole ? { role: selectedRole } : undefined
  )
  
  // User management mutations
  const createUserMutation = useCreateUser()
  const updateStatusMutation = useUpdateUserStatus()

  // Example: Create a new user
  const handleCreateUser = () => {
    createUserMutation.mutate({
      userData: {
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'data_entry'
      },
      performedBy: 'current-admin-user-id' // In real app, get from auth context
    })
  }

  // Example: Toggle user status
  const handleToggleUserStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active'
    updateStatusMutation.mutate({
      userId,
      status: newStatus as 'active' | 'disabled',
      performedBy: 'current-admin-user-id'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
        <span className="ml-2">Loading users...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 border border-red-200 rounded">
        Error loading users: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management API Demo</h2>
        <p className="text-muted-foreground">
          This example shows the user management functionality built in Phase 3
        </p>
      </div>

      {/* Create User Example */}
      <div className="p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">Create User</h3>
        <Button 
          onClick={handleCreateUser}
          disabled={createUserMutation.isPending}
        >
          {createUserMutation.isPending ? 'Creating...' : 'Create Test User'}
        </Button>
      </div>

      {/* Filter Users */}
      <div className="p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">Filter Users</h3>
        <select 
          value={selectedRole} 
          onChange={(e) => setSelectedRole(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Roles</option>
          <option value="ops_manager">Operations Manager</option>
          <option value="technician">Technician</option>
          <option value="qc_controller">QC Controller</option>
          <option value="data_entry">Data Entry</option>
        </select>
      </div>

      {/* Users List */}
      <div className="p-4 border rounded">
        <h3 className="text-lg font-semibold mb-4">Users ({users?.length || 0})</h3>
        
        {users?.length === 0 ? (
          <p className="text-muted-foreground">No users found</p>
        ) : (
          <div className="space-y-2">
            {users?.map((user: Record<string, unknown>) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-3 border rounded"
              >
                <div>
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.role} • {user.status}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleUserStatus(user.id, user.status)}
                  disabled={updateStatusMutation.isPending}
                >
                  {user.status === 'active' ? 'Disable' : 'Enable'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note about service role key */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800">⚠️ Setup Required</h4>
        <p className="text-yellow-700 text-sm mt-1">
          To test user creation and password reset, add <code>SUPABASE_SERVICE_ROLE_KEY</code> to your .env.local file.
          You can find this in your Supabase project settings under API.
        </p>
      </div>
    </div>
  )
}