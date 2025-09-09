'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useUser, useUpdateUser } from '@/lib/hooks/use-users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { RoleSelector, RoleBadge } from './role-selector'
import { UserActions } from './user-actions'

const editUserSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['admin', 'general_manager', 'ops_manager', 'qc_controller', 'technician']).refine((val) => val !== undefined, {
    message: 'Please select a role',
  }),
  technician_level: z.enum(['L1', 'L2', 'L3']).optional(),
}).refine((data) => {
  // If role is technician, technician_level is required
  if (data.role === 'technician' && !data.technician_level) {
    return false
  }
  return true
}, {
  message: 'Technician level is required for technician role',
  path: ['technician_level'],
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface EditUserFormProps {
  userId: string
  currentUserId?: string
  currentUserRole?: string
}

export function EditUserForm({ userId, currentUserId, currentUserRole }: EditUserFormProps) {
  const router = useRouter()
  const { data: user, isLoading, error, refetch } = useUser(userId)
  // Audit logs removed - not in MVP scope
  const updateUserMutation = useUpdateUser()
  const [hasChanges, setHasChanges] = useState(false)

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      role: user?.role as 'admin' | 'general_manager' | 'ops_manager' | 'qc_controller' | 'technician' | undefined,
      technician_level: user?.technician_level as 'L1' | 'L2' | 'L3' | undefined,
    },
  })

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        full_name: String(user.full_name || ''),
        role: user.role as 'admin' | 'general_manager' | 'ops_manager' | 'qc_controller' | 'technician',
        technician_level: user.technician_level as 'L1' | 'L2' | 'L3' | undefined,
      })
    }
  }, [user, form])

  // Watch for changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (user) {
        const changed = 
          values.full_name !== user.full_name ||
          values.role !== user.role
        setHasChanges(changed)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, user])

  const onSubmit = async (data: EditUserFormData) => {
    try {
      await updateUserMutation.mutateAsync({
        userId,
        userData: data,
        performedBy: currentUserId || 'unknown-admin'
      })

      // Refresh user data
      refetch()
      setHasChanges(false)
    } catch {
      // Error is handled by the mutation hook's toast
    }
  }

  const handleRefresh = () => {
    refetch()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
        <span className="ml-2">Loading user...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded">
        <h3 className="font-semibold">Error loading user</h3>
        <p className="text-sm mt-1">{error.message}</p>
        <Button onClick={handleRefresh} className="mt-2" size="sm">
          Try Again
        </Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">User not found</p>
        <Button onClick={() => router.push('/admin/users')} className="mt-2">
          Back to Users
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {String(user.full_name || 'No name set')}
                <RoleBadge role={String(user.role)} />
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                  {String(user.status || 'active')}
                </Badge>
              </CardTitle>
              <CardDescription>
                {user.auth_user?.email || 'No email'} • User ID: {String(user.id)}
              </CardDescription>
            </div>
            <UserActions 
              user={user}
              currentUserId={currentUserId}
              onUpdate={handleRefresh}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Created</p>
              <p>{user.created_at ? new Date(String(user.created_at)).toLocaleDateString() : 'Unknown'}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Last Login</p>
              <p>{user.last_login ? new Date(String(user.last_login)).toLocaleDateString() : 'Never'}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Created By</p>
              <p>{String(user.created_by || 'System')}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Must Change Password</p>
              <p>{user.must_change_password ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">User Details</TabsTrigger>

        </TabsList>

        {/* User Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Edit User Information</CardTitle>
              <CardDescription>
                Update the user&apos;s profile information and role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input 
                      value={user.auth_user?.email || ''} 
                      disabled 
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact system administrator if needed.
                    </p>
                  </div>

                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John Doe" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The user&apos;s display name in the system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Role */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <RoleSelector 
                            value={field.value} 
                            onValueChange={field.onChange}
                            currentUserRole={currentUserRole}
                          />
                        </FormControl>
                        <FormDescription>
                          Determines what features and data the user can access
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Technician Level - only show for technicians */}
                  {form.watch('role') === 'technician' && (
                    <FormField
                      control={form.control}
                      name="technician_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Technician Level</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select technician level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="L1">Level 1 (L1) - Housing change only</SelectItem>
                                <SelectItem value="L2">Level 2 (L2) - Glass change only</SelectItem>
                                <SelectItem value="L3">Level 3 (L3) - Battery and all other repairs</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Determines the type of repair tasks this technician can perform
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={!hasChanges || updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.push('/admin/users')}
                    >
                      Back to Users
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab - Removed (not in MVP scope) */}
      </Tabs>
    </div>
  )
}