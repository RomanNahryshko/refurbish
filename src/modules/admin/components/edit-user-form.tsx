'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useUser, useUpdateUser, useUserAuditLogs } from '@/lib/hooks/use-users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { RoleSelector, RoleBadge } from './role-selector'
import { UserActions } from './user-actions'

const editUserSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['data_entry', 'qc_controller', 'technician', 'ops_manager']).refine((val) => val !== undefined, {
    message: 'Please select a role',
  }),
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface EditUserFormProps {
  userId: string
  currentUserId?: string
}

export function EditUserForm({ userId, currentUserId }: EditUserFormProps) {
  const router = useRouter()
  const { data: user, isLoading, error, refetch } = useUser(userId)
  const { data: auditLogs, isLoading: auditLoading } = useUserAuditLogs(userId, 20)
  const updateUserMutation = useUpdateUser()
  const [hasChanges, setHasChanges] = useState(false)

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      full_name: '',
      role: undefined,
    },
  })

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        full_name: String(user.full_name || ''),
        role: user.role as 'data_entry' | 'qc_controller' | 'technician' | 'ops_manager',
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
    } catch (error) {
      // Error is handled by the mutation hook's toast
      console.error('Update user error:', error)
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
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
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
                          />
                        </FormControl>
                        <FormDescription>
                          Determines what features and data the user can access
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

        {/* Activity Log Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Recent actions performed on this user account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="flex items-center justify-center p-4">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Loading activity...</span>
                </div>
              ) : !auditLogs || auditLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No activity recorded for this user
                </p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log: Record<string, unknown>) => (
                    <div key={String(log.id)} className="flex items-start gap-3 p-3 border rounded">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{String(log.action || '').replace('_', ' ')}</span>
                          <span className="text-muted-foreground">
                            by {String((log.performer as Record<string, unknown>)?.full_name || 'System')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(String(log.created_at)).toLocaleString()}
                        </p>
                        {log.details && typeof log.details === 'object' && log.details !== null && Object.keys(log.details).length > 0 ? (
                          <div className="mt-1 text-xs bg-muted p-2 rounded">
                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}