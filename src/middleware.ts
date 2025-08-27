import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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
  
  if ((isProtectedPath || isChangePasswordPage) && !isLoginPage) {
    try {
      // Simple Supabase auth check
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      let supabaseResponse = NextResponse.next()
      
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

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Check if user must change password (except when already on change-password page)
      if (pathname !== '/change-password') {
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('must_change_password')
            .eq('id', user.id)
            .single()

          if (profile?.must_change_password === true) {
            const changePasswordUrl = new URL('/change-password', request.url)
            return NextResponse.redirect(changePasswordUrl)
          }
        } catch {
          // Continue without redirecting if there's an error
        }
      }
      
      return supabaseResponse
    } catch {
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