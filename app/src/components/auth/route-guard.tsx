'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/use-user'
import { useProfile } from '@/lib/hooks/use-profile'
import { useSupabaseIsReady } from '@/lib/stores/supabase-store'
import { getFirstAvailableModule } from '@/lib/config/route-permissions'
import { type UserRole } from '@/lib/types/business-types'

interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function RouteGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: RouteGuardProps) {
  const router = useRouter()
  const { user, isLoading } = useUser()
  const { data: profile, isLoading: profileLoading } = useProfile(!!user)
  const isReady = useSupabaseIsReady()

  useEffect(() => {
    // Wait for Supabase to be ready
    if (!isReady) return

    // If auth is required and user is not authenticated, redirect to login
    if (requireAuth && !isLoading && !user) {
      console.log('RouteGuard: User not authenticated, redirecting to login')
      router.push(redirectTo)
      return
    }

    // If user is authenticated but trying to access login page, redirect to first available page
    if (!requireAuth && user && !profileLoading) {
      console.log('RouteGuard: User already authenticated, redirecting to first available page')
      const userRole = (profile?.role || 'technician') as UserRole
      const firstAvailablePage = getFirstAvailableModule(userRole)
      router.push(firstAvailablePage)
      return
    }
  }, [user, isLoading, isReady, requireAuth, redirectTo, router, profile, profileLoading])

  // Show loading state while checking auth
  if (!isReady || (requireAuth && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If auth is required and no user, don't render children (will redirect)
  if (requireAuth && !user) {
    return null
  }

  // If auth is not required and user exists, don't render children (will redirect)
  if (!requireAuth && user) {
    return null
  }

  return <>{children}</>
}
