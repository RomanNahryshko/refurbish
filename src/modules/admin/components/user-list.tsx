'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useUsers } from '@/lib/hooks/use-users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { UserActions } from './user-actions'
import { UserFilters, UserWithAuth } from '@/lib/api/users'

interface UserListProps {
  currentUserId?: string
  currentUserRole?: string
}

export function UserList({ currentUserId, currentUserRole }: UserListProps) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Build filters object
  const filters = {
    ...(search && { search }),
    ...(roleFilter && roleFilter !== 'all' && { role: roleFilter }),
    ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
  }

  const { data: users, isLoading, error, refetch } = useUsers(
    Object.keys(filters).length > 0 ? filters as UserFilters : undefined
  )

  // Filter out current user from the list
  const filteredUsers = users?.filter(user => user.id !== currentUserId) || []

  const handleRefresh = () => {
    refetch()
  }

  const clearFilters = () => {
    setSearch('')
    setRoleFilter('all')
    setStatusFilter('all')
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
      <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded">
        <h3 className="font-semibold">Error loading users</h3>
        <p className="text-sm mt-1">{error.message}</p>
        <Button onClick={handleRefresh} className="mt-2" size="sm">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find users by name, email, role, or status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div>
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Role Filter */}
            <div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {currentUserRole === 'admin' && (
                    <SelectItem value="general_manager">General Manager</SelectItem>
                  )}
                  <SelectItem value="ops_manager">Operations Manager</SelectItem>
                  <SelectItem value="qc_controller">QC Controller</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'} found
        </p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm mt-2">
                {search || roleFilter || statusFilter 
                  ? 'Try adjusting your filters or create a new user'
                  : 'Get started by creating your first user'
                }
              </p>
              <Link href="/admin/users/create">
                <Button className="mt-4">Create New User</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Last Login</th>
                    <th className="text-left p-3 font-medium">Created</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: UserWithAuth) => (
                    <tr key={user.id} className="border-b hover:bg-accent/50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">
                            {user.full_name || 'No name set'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.auth_user?.email || 'No email'}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {user.created_at 
                          ? new Date(user.created_at).toLocaleDateString()
                          : 'Unknown'
                        }
                      </td>
                      <td className="p-3">
                        <UserActions 
                          user={user}
                          currentUserId={currentUserId}
                          onUpdate={handleRefresh}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}