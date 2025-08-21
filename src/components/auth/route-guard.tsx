'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/hooks/use-profile'
import { useUser } from '@/lib/hooks/use-user'
import { hasRouteAccess, getRedirectPath } from '@/lib/config/route-permissions'
import { type UserRole } from '@/lib/types/business-types'
import { LoadingSpinner } from '@/components/common/loading-spinner'

interface RouteGuardProps {
  children: React.ReactNode
}

/**
 * Client-side route guard component
 * Redirects users if they don't have access to the current route
 */
export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useUser()
  const { data: profile, isLoading: profileLoading } = useProfile(!!user)

  useEffect(() => {
    // Don't check if still loading
    if (userLoading || profileLoading) return
    
    // Don't check if no user (handled by auth middleware)
    if (!user || !profile) return

    const currentPath = window.location.pathname
    const userRole = profile.role as UserRole

    // Check if user has access to current route
    if (!hasRouteAccess(userRole, currentPath)) {
      const redirectPath = getRedirectPath(userRole, currentPath)
      router.replace(redirectPath)
    }
  }, [user, profile, userLoading, profileLoading, router])

  // Show loading while checking permissions
  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <LoadingSpinner size="md" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // If no user, let auth middleware handle it
  if (!user) {
    return <>{children}</>
  }

  // If no profile, something is wrong but let it through
  if (!profile) {
    return <>{children}</>
  }

  // Check access again before rendering
  const currentPath = window.location.pathname
  const userRole = profile.role as UserRole

  if (!hasRouteAccess(userRole, currentPath)) {
    // This should rarely happen since useEffect should handle redirects
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => router.replace(getRedirectPath(userRole, currentPath))}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Hook to check if current user has access to a specific route
 */
export function useRouteAccess(pathname?: string) {
  const { data: user } = useUser()
  const { data: profile } = useProfile(!!user)
  
  const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '/')
  
  if (!profile) return { hasAccess: false, isLoading: true }
  
  const userRole = profile.role as UserRole
  const hasAccess = hasRouteAccess(userRole, currentPath)
  
  return {
    hasAccess,
    isLoading: false,
    userRole,
    redirectPath: !hasAccess ? getRedirectPath(userRole, currentPath) : null
  }
}
