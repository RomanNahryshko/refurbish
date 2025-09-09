import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🔐 Redirect API: Request received')
  
  try {
    // Log all cookies for debugging
    const allCookies = request.cookies.getAll()
    console.log('🍪 Redirect API: All cookies:', allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })))
    
    // For now, just return redirect without auth check to test if the issue is with auth
    console.log('✅ Redirect API: Returning redirect without auth check (for testing)')

    // Return redirect URL
    return NextResponse.json({ 
      success: true, 
      redirectUrl: '/dashboard',
      message: 'Redirect granted without auth check (testing mode)'
    })
  } catch (error) {
    console.error('❌ Redirect API: Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
