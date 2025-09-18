import { NextResponse } from 'next/server'
import { getFirstAvailableModule } from '@/lib/config/route-permissions'

export async function POST() {
  
  try {
    // Return redirect URL to first available page
    return NextResponse.json({ 
      success: true, 
      redirectUrl: getFirstAvailableModule('technician'),
      message: 'Redirect granted without auth check (testing mode)'
    })
  } catch (error) {
    console.error('❌ Redirect API: Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
