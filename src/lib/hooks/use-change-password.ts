import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/hooks/use-toast'
import { useSupabaseClient } from '@/lib/hooks/use-supabase-client'

interface PasswordStatus {
  user: {
    id: string
    email: string
  }
  mustChangePassword: boolean
  role: string
}

interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export function usePasswordStatus() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabaseClient()

  const checkPasswordStatus = async (): Promise<PasswordStatus | null> => {
    setLoading(true)
    setError(null)

    try {
      if (!supabase) {
        setError('Supabase client not available')
        return null
      }

      // Get current user with retry logic
      let user = null
      let retries = 5 // Increased retries for better reliability
      
      while (retries > 0 && !user) {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Error getting current user:', userError)
          retries--
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 200)) // Reduced wait time
            continue
          }
          setError('Failed to get current user')
          return null
        }
        
        if (currentUser) {
          user = currentUser
          break
        }
        
        retries--
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 200)) // Reduced wait time
        }
      }
      
      if (!user) {
        setError('User not authenticated')
        return null
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('must_change_password, role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setError('Failed to fetch user profile')
        return null
      }

      return {
        user: {
          id: user.id,
          email: user.email || ''
        },
        mustChangePassword: profile?.must_change_password === true,
        role: profile?.role || 'technician'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    checkPasswordStatus,
    loading,
    error
  }
}

export function useChangePassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const toast = useToast()

  const changePassword = async (data: ChangePasswordData): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password')
      }

      // Show success message
      toast.success({
        title: 'Password Changed',
        description: 'Your password has been updated successfully. Redirecting...'
      })

      // Redirect to appropriate page based on user role
      setTimeout(() => {
        router.replace(result.redirectPath || '/dashboard')
      }, 1500)

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      
      // Show error toast
      toast.error({
        title: 'Password Change Failed',
        description: errorMessage
      })

      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    changePassword,
    loading,
    error
  }
}
