'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSupabaseStore } from '@/lib/stores/supabase-store'

export function LoginForm() {
  const { push } = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useSupabaseStore()

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
      console.error('Login error:', err)
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
        push('/homepage')
        return
      }
      setUser(user)

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('must_change_password, role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        push('/homepage')
        return
      }

      // Check if user must change password
      if (profile?.must_change_password) {
        push('/change-password')
      } else {
        // Check if user has access to specific modules based on role
        // const userRole = profile?.role || 'technician'
        
        // Always redirect to homepage after successful login
        push('/homepage')
      }
    } else {
      // Fallback to homepage if no supabase client
      push('/homepage')
    }
  }
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6">
        <div className="flex flex-col space-y-2 text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to sign in
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
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
    </div>
  )
}