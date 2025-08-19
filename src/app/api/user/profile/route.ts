import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/user/profile - Get current user's profile
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, status, technician_level')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // Return basic info if profile doesn't exist
      return NextResponse.json({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Unknown User',
        role: null
      })
    }
    
    return NextResponse.json({
      ...profile,
      email: user.email
    })
  } catch (error) {
    console.error('Error in profile API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}