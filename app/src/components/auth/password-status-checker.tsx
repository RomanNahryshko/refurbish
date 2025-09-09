'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseClient } from '@/lib/stores/supabase-store'
import { hasDashboardAccess, getFirstAvailableModule } from '@/lib/config/route-permissions'
import { UserRole } from '@/lib/types/business-types'

export function PasswordStatusChecker() {
  const router = useRouter()
  const supabase = useSupabaseClient()

  useEffect(() => {
    const checkPasswordStatus = async () => {
      if (!supabase) return

      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          // If no user, redirect to login
          router.replace('/login')
          return
        }

        // Get user profile to check password status and role
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('must_change_password, role')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching user profile:', profileError)
          return
        }

        // If user must change password, redirect to change-password page
        if (profile?.must_change_password === true) {
          router.replace('/change-password')
          return
        }

        // Check if user has dashboard access
        const userRole = profile?.role || 'technician'
        
        if (!hasDashboardAccess(userRole as UserRole)) {
          // User doesn't have dashboard access, redirect to first available module
          const firstModule = getFirstAvailableModule(userRole as UserRole)
          router.replace(firstModule)
          return
        }

        // User is authenticated and has access to dashboard
        // No redirect needed, stay on current page
      } catch (error) {
        console.error('Error checking password status:', error)
      }
    }

    // Check password status when component mounts
    checkPasswordStatus()
  }, [supabase, router])

  // This component doesn't render anything visible
  return null
}

