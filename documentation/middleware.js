export function middleware(request) {
  // Check if user is authenticated
  const basicAuth = request.headers.get('authorization')
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')
    
    // Replace these with your desired credentials
    if (user === 'remobile' && pwd === 'secure-docs-2024') {
      return
    }
  }
  
  // Return 401 with authentication challenge
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Documentation"',
    },
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 