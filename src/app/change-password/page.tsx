'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePasswordStatus, useChangePassword } from '@/lib/hooks/use-change-password'
import { getRedirectPath } from '@/lib/config/route-permissions'
import { UserRole } from '@/lib/types/business-types'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export default function ChangePasswordPage() {
  const router = useRouter()
  const [pageLoading, setPageLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<{
    user: {
      id: string
      email: string | null
    }
    mustChangePassword: boolean
    role: string
  } | null>(null)
  const initialized = useRef(false)

  const { checkPasswordStatus, loading: statusLoading } = usePasswordStatus()
  const { changePassword, loading: changeLoading } = useChangePassword()

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized.current) return
    initialized.current = true

    const checkUser = async () => {
      try {
        const status = await checkPasswordStatus()
        
        if (!status) {
          // User not authenticated, redirect to login
          router.replace('/login')
          return
        }

        setUserInfo(status)

        // If user doesn't need to change password, redirect based on role
        if (!status.mustChangePassword) {
          const redirectPath = getRedirectPath(status.role as UserRole, '/change-password')
          router.replace(redirectPath)
          return
        }

        setPageLoading(false)
      } catch (error) {
        console.error('Error checking user status:', error)
        router.replace('/login')
      }
    }

    checkUser()
  }, [router, checkPasswordStatus])

  const onSubmit = async (data: ChangePasswordFormData) => {
    const success = await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    })

    if (success) {
      // Reset form on success
      form.reset()
    }
  }

  const handleCancel = () => {
    if (userInfo?.role) {
      const redirectPath = getRedirectPath(userInfo.role as UserRole, '/change-password')
      router.push(redirectPath)
    } else {
      router.push('/dashboard')
    }
  }

  const getCancelButtonText = () => {
    if (!userInfo?.role) return 'Cancel and return'
    
    switch (userInfo.role) {
      case 'technician':
        return 'Cancel and return to home'
      case 'qc_controller':
        return 'Cancel and return to dashboard'
      default:
        return 'Cancel and return to dashboard'
    }
  }

  if (pageLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <LoadingSpinner size="md" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Redirecting to login...</div>
      </div>
    )
  }

  const isForced = userInfo.mustChangePassword

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isForced ? 'Password Change Required' : 'Change Password'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isForced 
              ? 'You must change your password before continuing'
              : 'Update your account password'
            }
          </p>
        </div>

        {isForced && (
          <Alert>
            <AlertDescription>
              For security reasons, you must change your temporary password before accessing the system.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>New Password</CardTitle>
            <CardDescription>
              Choose a strong password with at least 8 characters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Current Password */}
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your current password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* New Password */}
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your new password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Confirm your new password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={changeLoading}
                  >
                    {changeLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Changing Password...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {!isForced && (
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              className="text-sm"
              disabled={changeLoading}
            >
              {getCancelButtonText()}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}