import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '../supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { hasRouteAccess, getRedirectPath } from '@/lib/config/route-permissions';
import { type UserRole } from '@/lib/types/business-types';

// Simple cache for user profile data to prevent duplicate queries
const userProfileCache = new Map<string, { must_change_password: boolean; role: string; timestamp: number }>()
const PROFILE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached user profile data or fetch from database
 */
async function getCachedUserProfile(supabase: SupabaseClient, userId: string): Promise<{ must_change_password: boolean; role: string } | null> {
  const now = Date.now()
  const cached = userProfileCache.get(userId)
  
  // Return cached data if still valid
  if (cached && (now - cached.timestamp) < PROFILE_CACHE_TTL) {
    return { must_change_password: cached.must_change_password, role: cached.role }
  }
  
  // Fetch from database
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('must_change_password, role')
      .eq('id', userId)
      .single()
    
    if (error || !profile) return null
    
    // Cache the data
    const profileData = { 
      must_change_password: profile.must_change_password, 
      role: profile.role,
      timestamp: now 
    }
    userProfileCache.set(userId, profileData)
    return { must_change_password: profileData.must_change_password, role: profileData.role }
  } catch (error) {
    console.error('Error fetching user profile in middleware:', error)
    return null
  }
}

export async function updateSession(request: NextRequest) {
  // Skip authentication if Supabase is not configured
  if (!hasValidSupabaseConfig) {
    return NextResponse.next({
      request,
    })
  }

  // Skip middleware for home page and static assets to prevent redirect loops
  const pathname = request.nextUrl.pathname
  console.log('🔍 Middleware processing:', pathname)
  
  if (pathname === '/') {
    console.log('🏠 Skipping middleware for home page')
    return NextResponse.next({
      request,
    })
  }
  
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.') || pathname.startsWith('/api/')) {
    console.log('🚫 Skipping middleware for:', pathname)
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  const protectedPaths = [
    '/dashboard',
    '/admin',
    '/batch-intake',
    '/phone-tracking',
    '/repair-jobs',
    '/inventory',
    '/shipping',
    '/qc',
    '/devices',
    '/suppliers',
    '/api/protected'
  ]
  const authPaths = ['/login']
  const passwordChangePath = '/change-password'
  
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  )
  const isAuthPath = authPaths.some(path => 
    pathname.startsWith(path)
  )
  const isPasswordChangePage = pathname === passwordChangePath

  // Redirect to login if accessing protected route without session
  if (!user && isProtectedPath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check if user must change password (for authenticated users only)
  if (user && !isPasswordChangePage && !isAuthPath) {
    try {
      const profile = await getCachedUserProfile(supabase, user.id)

      // Redirect to password change page if flag is set
      if (profile?.must_change_password === true) {
        return NextResponse.redirect(new URL(passwordChangePath, request.url))
      }
    } catch {
      // If we can't check the profile, allow the request to continue
      console.warn('Could not check must_change_password flag')
    }
  }

  // Redirect if accessing auth pages while logged in (unless forced password change)
  if (user && isAuthPath) {
    // First check if they need to change password
    try {
      const profile = await getCachedUserProfile(supabase, user.id)

      if (profile?.must_change_password === true) {
        return NextResponse.redirect(new URL(passwordChangePath, request.url))
      }
      
      // Redirect based on user role
      const userRole = profile?.role as UserRole
      const defaultRedirectPath = getRedirectPath(userRole || 'technician', '/dashboard')
      return NextResponse.redirect(new URL(defaultRedirectPath, request.url))
    } catch {
      // Continue to home if we can't check role
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Check route access permissions for authenticated users
  if (user && isProtectedPath) {
    try {
      const profile = await getCachedUserProfile(supabase, user.id)
      
      if (profile?.role) {
        const userRole = profile.role as UserRole
        
        // Check if user has access to this route
        if (!hasRouteAccess(userRole, request.nextUrl.pathname)) {
          const redirectPath = getRedirectPath(userRole, request.nextUrl.pathname)
          console.log(`Access denied for ${userRole} to ${request.nextUrl.pathname}, redirecting to ${redirectPath}`)
          return NextResponse.redirect(new URL(redirectPath, request.url))
        }
      }
    } catch (error) {
      console.error('Error checking route permissions:', error)
      // If we can't check permissions, allow the request to continue
    }
  }

  return supabaseResponse
}

/**
 * Clear user profile cache (call this when user logs out or changes password)
 */
export function clearUserProfileCache(userId: string) {
  userProfileCache.delete(userId)
} 