import { createServerClient, type SupabaseClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '../supabase';

// Simple cache for user profile data to prevent duplicate queries
const userProfileCache = new Map<string, { must_change_password: boolean; timestamp: number }>()
const PROFILE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached user profile data or fetch from database
 */
async function getCachedUserProfile(supabase: SupabaseClient, userId: string): Promise<{ must_change_password: boolean } | null> {
  const now = Date.now()
  const cached = userProfileCache.get(userId)
  
  // Return cached data if still valid
  if (cached && (now - cached.timestamp) < PROFILE_CACHE_TTL) {
    return cached
  }
  
  // Fetch from database
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('must_change_password')
      .eq('id', userId)
      .single()
    
    if (error || !profile) return null
    
    // Cache the data
    const profileData = { must_change_password: profile.must_change_password, timestamp: now }
    userProfileCache.set(userId, profileData)
    return profileData
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
    '/api/protected'
  ]
  const authPaths = ['/login']
  const passwordChangePath = '/change-password'
  
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  const isAuthPath = authPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  const isPasswordChangePage = request.nextUrl.pathname === passwordChangePath

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

  // Redirect to dashboard if accessing auth pages while logged in (unless forced password change)
  if (user && isAuthPath) {
    // First check if they need to change password
    try {
      const profile = await getCachedUserProfile(supabase, user.id)

      if (profile?.must_change_password === true) {
        return NextResponse.redirect(new URL(passwordChangePath, request.url))
      }
    } catch {
      // Continue to dashboard if we can't check
    }
    
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

/**
 * Clear user profile cache (call this when user logs out or changes password)
 */
export function clearUserProfileCache(userId: string) {
  userProfileCache.delete(userId)
} 