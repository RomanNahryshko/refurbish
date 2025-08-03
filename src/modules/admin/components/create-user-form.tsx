'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateUser } from '@/lib/hooks/use-users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { RoleSelector } from './role-selector'

const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['data_entry', 'qc_controller', 'technician', 'ops_manager']).refine((val) => val !== undefined, {
    message: 'Please select a role',
  }),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface CreateUserFormProps {
  currentUserId?: string
  onSuccess?: () => void
}

export function CreateUserForm({ currentUserId, onSuccess }: CreateUserFormProps) {
  const router = useRouter()
  const createUserMutation = useCreateUser()
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      full_name: '',
      role: undefined,
    },
  })

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      const result = await createUserMutation.mutateAsync({
        userData: data,
        performedBy: currentUserId || 'unknown-admin'
      })

      // Show the generated password
      setGeneratedPassword(result.temporaryPassword)
      setShowPassword(true)

      // Reset form
      form.reset()

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess()
      } else {
        // Don't redirect immediately - let admin see the password first
        setTimeout(() => {
          router.push('/admin/users')
        }, 5000) // Auto-redirect after 5 seconds
      }
    } catch (error) {
      // Error is handled by the mutation hook's toast
      console.error('Create user error:', error)
    }
  }

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword)
    // You could add a toast here to confirm copy
  }

  const goToUserList = () => {
    router.push('/admin/users')
  }

  if (showPassword) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-green-600">✅ User Created Successfully!</CardTitle>
          <CardDescription>
            The user account has been created. Please share these credentials with the new user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800 mb-2">Temporary Login Credentials</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Email:</span> {form.getValues('email')}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Password:</span> 
                <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono">
                  {generatedPassword}
                </code>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCopyPassword}
                >
                  Copy
                </Button>
              </div>
            </div>
            <p className="text-yellow-700 text-xs mt-2">
              ⚠️ The user will be required to change this password on their first login.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setShowPassword(false)}>
              Create Another User
            </Button>
            <Button variant="outline" onClick={goToUserList}>
              Back to User List
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
        <CardDescription>
          Add a new user to the system with appropriate role and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="user@example.com" 
                      type="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This will be the user's login email address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    The user's display name in the system
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

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-semibold text-blue-800 mb-1">What happens next?</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• A secure temporary password will be generated</li>
                <li>• The user account will be created immediately</li>
                <li>• You'll receive the login credentials to share</li>
                <li>• The user must change their password on first login</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
                className="flex-1"
              >
                {createUserMutation.isPending ? 'Creating User...' : 'Create User'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={goToUserList}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}