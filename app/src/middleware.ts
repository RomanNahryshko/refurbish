import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { hasRouteAccess } from '@/lib/config/route-permissions'
import type { UserRole } from '@/lib/types/business-types'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip middleware for home page and specific paths to prevent loops
  if (pathname === '/' || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/api/') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }

  // Basic auth check - only redirect to login if accessing protected pages without auth
  const protectedPaths = ['/homepage', '/dashboard', '/devices', '/repair-jobs', '/qc', '/admin', '/batch-intake', '/inventory', '/suppliers']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isLoginPage = pathname.startsWith('/login')
  const isChangePasswordPage = pathname.startsWith('/change-password')
  
  // Skip middleware for login and change-password pages to prevent redirect loops
  if (isLoginPage || isChangePasswordPage) {
    return NextResponse.next()
  }
  
  if (isProtectedPath) {
    
    try {
      // Simple Supabase auth check - use proxy URL if available
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const supabaseResponse = NextResponse.next()
      
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      })

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      // Log auth check for debugging
      if (userError) {
        console.log('Middleware auth error:', userError.message)
      }
      
      if (!user) {
        // Clear any existing auth cookies when redirecting to login
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectTo', pathname)
        
        // Clear auth cookies in response
        supabaseResponse.cookies.delete('sb-access-token')
        supabaseResponse.cookies.delete('sb-refresh-token')
        
        return NextResponse.redirect(redirectUrl)
      }

      // Check user status and role in user_profiles table
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('status, role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        // If we can't check the profile, allow the request to continue
        // This prevents middleware from blocking requests due to database issues
      } else if (profile && profile.status !== 'active') {
        // Clear auth cookies and redirect to login for inactive users
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectTo', pathname)
        redirectUrl.searchParams.set('error', 'account_inactive')
        
        // Clear auth cookies in response
        supabaseResponse.cookies.delete('sb-access-token')
        supabaseResponse.cookies.delete('sb-refresh-token')
        
        return NextResponse.redirect(redirectUrl)
      }

      // Check role-based route access (skip for homepage to prevent redirect loops)
      if (profile && profile.role && pathname !== '/homepage') {
        const hasAccess = hasRouteAccess(profile.role as UserRole, pathname)
        
        if (!hasAccess) {
          // Always redirect to homepage for unauthorized access
          // Check if we're not already trying to redirect to homepage to prevent loops
          if (pathname !== '/homepage') {
            const redirectUrl = new URL('/homepage', request.url)
            return NextResponse.redirect(redirectUrl)
          }
        }
      }
      
      // Simplified logic - just check if user exists, don't check password status here
      // Password status will be checked on the client side after redirect
      return supabaseResponse
    } catch {
      // If there's any error, allow the request to continue
      // This prevents middleware from blocking requests due to auth issues
      return NextResponse.next()
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files with extensions (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 