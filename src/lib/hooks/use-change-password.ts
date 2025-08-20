import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from './use-toast'

interface PasswordStatus {
  user: {
    id: string
    email: string | null
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

  const checkPasswordStatus = async (): Promise<PasswordStatus | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/password-status')
      
      if (!response.ok) {
        if (response.status === 401) {
          return null // User not authenticated
        }
        throw new Error('Failed to check password status')
      }

      const data = await response.json()
      return data
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
