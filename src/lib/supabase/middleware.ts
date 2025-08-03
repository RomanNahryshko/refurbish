import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '../supabase'

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
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('must_change_password')
        .eq('id', user.id)
        .single()

      // Redirect to password change page if flag is set
      if (profile?.must_change_password === true) {
        return NextResponse.redirect(new URL(passwordChangePath, request.url))
      }
    } catch (error) {
      // If we can't check the profile, allow the request to continue
      console.warn('Could not check must_change_password flag:', error)
    }
  }

  // Redirect to dashboard if accessing auth pages while logged in (unless forced password change)
  if (user && isAuthPath) {
    // First check if they need to change password
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('must_change_password')
        .eq('id', user.id)
        .single()

      if (profile?.must_change_password === true) {
        return NextResponse.redirect(new URL(passwordChangePath, request.url))
      }
    } catch (error) {
      // Continue to dashboard if we can't check
    }
    
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
} 