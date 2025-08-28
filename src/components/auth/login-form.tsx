'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function LoginForm() {
  const { push } = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createSupabaseClient()
      
      if (!supabase) {
        setError('Configuration error. Please contact your administrator.')
        setIsLoading(false)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setIsLoading(false)
        return
      }

      // Check login status and redirect
      checkLoginStatus()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const checkLoginStatus = async () => {
    const supabase = createSupabaseClient()
    
    if (supabase) {
      // Get current user after successful login
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting current user:', userError)
        // Fallback to homepage if user fetch fails
        push('/homepage')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('must_change_password, role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        // Fallback to homepage if profile fetch fails
        push('/homepage')
        return
      }

      // Check if user must change password
      if (profile?.must_change_password) {
        push('/change-password')
      } else {
        // Check if user has access to specific modules based on role
        const userRole = profile?.role || 'technician'
        
        // Always redirect to homepage after successful login
        push('/homepage')
      }
    } else {
      // Fallback to homepage if no supabase client
      push('/homepage')
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
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to sign in
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}