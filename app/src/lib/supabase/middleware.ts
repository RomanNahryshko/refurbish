import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '../supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { hasRouteAccess, getRedirectPath } from '@/lib/config/route-permissions';
import { type UserRole } from '@/lib/types/business-types';

// Simple cache for user profile data to prevent duplicate queries
const userProfileCache = new Map<string, { must_change_password: boolean; role: string; status: string; timestamp: number }>()
const PROFILE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached user profile data or fetch from database
 */
async function getCachedUserProfile(supabase: SupabaseClient, userId: string): Promise<{ must_change_password: boolean; role: string; status: string } | null> {
  const now = Date.now()
  const cached = userProfileCache.get(userId)
  
  // Return cached data if still valid
  if (cached && (now - cached.timestamp) < PROFILE_CACHE_TTL) {
    return { must_change_password: cached.must_change_password, role: cached.role, status: cached.status }
  }
  
  // Fetch from database
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('must_change_password, role, status')
      .eq('id', userId)
      .single()
    
    if (error || !profile) return null
    
    // Cache the data
    const profileData = { 
      must_change_password: profile.must_change_password, 
      role: profile.role,
      status: profile.status,
      timestamp: now 
    }
    userProfileCache.set(userId, profileData)
    return { must_change_password: profileData.must_change_password, role: profileData.role, status: profileData.status }
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
  
  if (pathname === '/') {
    return NextResponse.next({
      request,
    })
  }
  
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.') || pathname.startsWith('/api/')) {
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

      // Check if user account is active
      if (profile && profile.status !== 'active') {
        // Clear auth cookies and redirect to login for inactive users
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('error', 'account_inactive')
        
        // Clear auth cookies in response
        supabaseResponse.cookies.delete('sb-access-token')
        supabaseResponse.cookies.delete('sb-refresh-token')
        
        return NextResponse.redirect(redirectUrl)
      }

      // Redirect to password change page if flag is set
      if (profile?.must_change_password === true) {
        return NextResponse.redirect(new URL(passwordChangePath, request.url))
      }
    } catch {
      // If we can't check the profile, allow the request to continue
      console.warn('Could not check user profile')
    }
  }

  // Redirect if accessing auth pages while logged in (unless forced password change)
  if (user && isAuthPath) {
    // First check if they need to change password
    try {
      const profile = await getCachedUserProfile(supabase, user.id)

      // Check if user account is active
      if (profile && profile.status !== 'active') {
        // Clear auth cookies and redirect to login for inactive users
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('error', 'account_inactive')
        
        // Clear auth cookies in response
        supabaseResponse.cookies.delete('sb-access-token')
        supabaseResponse.cookies.delete('sb-refresh-token')
        
        return NextResponse.redirect(redirectUrl)
      }

      if (profile?.must_change_password === true) {
        return NextResponse.redirect(new URL(passwordChangePath, request.url))
      }
      
      // Always redirect to homepage after login
      return NextResponse.redirect(new URL('/homepage', request.url))
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