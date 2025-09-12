import { NextResponse } from 'next/server'

export async function POST() {
  
  try {
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
