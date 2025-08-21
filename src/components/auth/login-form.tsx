'use client'

import { useState, FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { login } from '@/lib/actions/auth'
import { hasDashboardAccess, getFirstAvailableModule } from '@/lib/config/route-permissions'
import { UserRole } from '@/lib/types/business-types'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)

    try {
      // Run login and minimum delay in parallel
      const [result] = await Promise.all([
        login({
          email: formData.get('email') as string,
          password: formData.get('password') as string,
        }),
        new Promise(resolve => setTimeout(resolve, 800)) // Minimum 800ms loading time
      ])

      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      } else {
        // Check password status before redirecting
        try {
          const statusResponse = await fetch('/api/auth/password-status')
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            
            // If user must change password, redirect to change-password page
            if (statusData.mustChangePassword) {
              window.location.href = '/change-password'
            } else {
              // Check if user has dashboard access
              const userRole = statusData.role || 'technician'
              
              if (hasDashboardAccess(userRole as UserRole)) {
                // User has dashboard access, redirect to dashboard
                window.location.href = '/dashboard'
              } else {
                // User doesn't have dashboard access, redirect to first available module
                const firstModule = getFirstAvailableModule(userRole as UserRole)
                window.location.href = firstModule
              }
            }
          } else {
            // Fallback to dashboard if status check fails
            window.location.href = '/dashboard'
          }
        } catch {
          // Fallback to dashboard if status check fails
          window.location.href = '/dashboard'
        }
      }
    } catch {
      setError('An unexpected error occurred.')
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleFormSubmit}>
        <CardContent className="pb-6">
          <div className="text-center pt-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Sign In</h2>
          </div>
          <div className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
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
              />
            </div>
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
              </Button>
            </div>
          </div>
        </CardContent>
      </form>
    </Card>
  )
} 