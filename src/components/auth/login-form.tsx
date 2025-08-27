'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { login } from '@/lib/actions/auth'
import { useSupabaseForceRecreate, useSupabaseContext } from '@/lib/providers/supabase-provider'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const forceRecreateClient = useSupabaseForceRecreate()
  const { client: supabase, isReady } = useSupabaseContext()
  const router = useRouter()

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log('🚀 Login form submitted')
    console.log('📊 Form state - Supabase ready:', isReady, 'Client exists:', !!supabase)

    // Check if Supabase client is ready
    if (!isReady || !supabase) {
      console.error('❌ Supabase not ready for login')
      setError('Authentication system is not ready. Please wait a moment and try again.')
      setIsLoading(false)
      return
    }

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('📧 Login attempt for email:', email)
    console.log('🔒 Password length:', password.length)

    try {
      // Run login and minimum delay in parallel
      console.log('📡 Calling login action...')
      const [result] = await Promise.all([
        login({
          email,
          password,
        }),
        new Promise(resolve => setTimeout(resolve, 800)) // Minimum 800ms loading time
      ])

      console.log('📨 Login action response received:', result)
      console.log('📋 Response type:', typeof result)
      console.log('📋 Response keys:', result ? Object.keys(result) : 'null/undefined')

      if (result?.error) {
        console.error('❌ Login failed with error:', result.error)
        setError(result.error)
        setIsLoading(false)
      } else if (result?.success) {
        console.log('✅ Login successful, user data:', result.user)
        
        // Use API endpoint to verify authentication and get redirect URL
        console.log('🔄 Verifying authentication via API...')
        
        try {
          // Clear browser cache and storage before redirect
          console.log('🧹 Clearing browser cache...')
          if ('caches' in window) {
            try {
              await caches.keys().then(names => {
                names.forEach(name => caches.delete(name))
              })
              console.log('✅ Browser cache cleared')
            } catch (cacheError) {
              console.warn('⚠️ Cache clearing warning:', cacheError)
            }
          }
          
          const redirectResponse = await fetch('/api/auth/redirect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (redirectResponse.ok) {
            const redirectData = await redirectResponse.json()
            console.log('✅ API redirect response:', redirectData)
            
            if (redirectData.success && redirectData.redirectUrl) {
              console.log('🔄 Redirecting to:', redirectData.redirectUrl)
              
              // Try multiple redirect methods
              try {
                // Method 1: router.push
                console.log('🔄 Method 1: Using router.push...')
                router.push(redirectData.redirectUrl)
                
                // Method 2: Fallback to window.location
                setTimeout(() => {
                  console.log('🔄 Method 2: Fallback to window.location...')
                  window.location.href = redirectData.redirectUrl
                }, 1000)
                
                // Method 3: Force reload and redirect
                setTimeout(() => {
                  console.log('🔄 Method 3: Force reload and redirect...')
                  window.location.replace(redirectData.redirectUrl)
                }, 2000)
                
              } catch (redirectError) {
                console.error('❌ Router redirect failed:', redirectError)
                console.log('🔄 Falling back to window.location...')
                window.location.href = redirectData.redirectUrl
              }
            } else {
              console.error('❌ Invalid redirect response:', redirectData)
              setError('Redirect failed. Please try again.')
              setIsLoading(false)
            }
          } else {
            console.error('❌ Redirect API failed:', redirectResponse.status)
            setError('Authentication verification failed. Please try again.')
            setIsLoading(false)
          }
        } catch (apiError) {
          console.error('❌ Redirect API error:', apiError)
          setError('Authentication verification failed. Please try again.')
          setIsLoading(false)
        }
      } else {
        console.warn('⚠️ Unexpected login result:', result)
        setError('Unexpected response from server. Please try again.')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('💥 Login error caught:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  // Show loading state if Supabase is not ready
  if (!isReady) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pb-6">
          <div className="text-center pt-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Initializing...</h2>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Please wait while we set up authentication...</p>
            <Button 
              onClick={() => {
                console.log('Manual reset triggered')
                forceRecreateClient()
              }}
              variant="outline" 
              className="mt-4"
            >
              Reset Authentication
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleFormSubmit}>
        <CardContent className="pb-6">
          <div className="text-center pt-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Sign In</h2>
            <div className="text-xs text-gray-500 mt-1">
              Supabase: {isReady ? 'Ready' : 'Not Ready'} | Client: {supabase ? 'Exists' : 'Missing'}
            </div>
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