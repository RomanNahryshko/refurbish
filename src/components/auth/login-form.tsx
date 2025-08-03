'use client'

import { useState, FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { login } from '@/lib/actions/auth'

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
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError('An unexpected error occurred.')
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleFormSubmit}>
        <CardContent className="space-y-6 pt-6">
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
        </CardContent>
      </form>
    </Card>
  )
} 