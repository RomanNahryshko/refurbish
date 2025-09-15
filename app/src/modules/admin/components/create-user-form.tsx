'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateUser } from '@/lib/hooks/use-users'
import { useToast } from '@/lib/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RoleSelector } from './role-selector'

const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
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

type CreateUserFormData = z.infer<typeof createUserSchema>

interface CreateUserFormProps {
  currentUserId?: string
  currentUserRole?: string
  onSuccess?: () => void
}

export function CreateUserForm({ currentUserId, currentUserRole, onSuccess }: CreateUserFormProps) {
  const router = useRouter()
  const createUserMutation = useCreateUser()
  const toast  = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      full_name: '',
      role: undefined,
      technician_level: undefined,
    },
  })

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      const result = await createUserMutation.mutateAsync({
        userData: data,
        performedBy: currentUserId || 'unknown-admin'
      })

      // Show the generated password and store user email
      setGeneratedPassword(result.temporaryPassword)
      setUserEmail(data.email)
      setShowPassword(true)

      // Reset form
      form.reset()

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
      // No automatic redirect - let admin copy password and navigate manually
    } catch {
      // Error is handled by the mutation hook's toast
    }
  }

  const handleCopyCredentials = () => {
    const fullMessage = `Hi,

Your credentials to access https://workflow.remobile.eu/:

Email: ${userEmail}

Password: ${generatedPassword}`
    
    navigator.clipboard.writeText(fullMessage)
    toast.success({
      title: 'Credentials copied to clipboard!',
      description: 'The full message with email and password has been copied.',
    })
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
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-yellow-800">Temporary Login Credentials</h4>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCopyCredentials}
                className="ml-2"
              >
                Copy All
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Email:</span> {userEmail}
              </div>
              <div>
                <span className="font-medium">Password:</span> 
                <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono ml-2">
                  {generatedPassword}
                </code>
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
                    This will be the user&apos;s login email address
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

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-semibold text-blue-800 mb-1">What happens next?</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• A secure temporary password will be generated</li>
                <li>• The user account will be created immediately</li>
                <li>• You&apos;ll receive the login credentials to share</li>
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