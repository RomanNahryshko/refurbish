'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { signup } from '@/lib/actions/auth'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { USER_ROLES } from '@/lib/constants'
import { UserRole } from '@/lib/types'

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    const result = await signup({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      full_name: formData.get('fullName') as string,
      role: formData.get('role') as UserRole,
    })

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Enter your details to create a new account
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-error bg-error/10 border border-error/20 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isLoading}
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 6 characters
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role" required disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={USER_ROLES.DATA_ENTRY}>
                  Data Entry
                </SelectItem>
                <SelectItem value={USER_ROLES.QC_CONTROLLER}>
                  QC Controller
                </SelectItem>
                <SelectItem value={USER_ROLES.TECHNICIAN}>
                  Technician
                </SelectItem>
                <SelectItem value={USER_ROLES.OPS_MANAGER}>
                  Operations Manager
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
} 