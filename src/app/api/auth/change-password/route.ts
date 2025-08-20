import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clearUserProfileCache } from '@/lib/supabase/middleware'
import { getRedirectPath } from '@/lib/config/route-permissions'
import { UserRole } from '@/lib/types/business-types'

interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase configuration error' },
        { status: 500 }
      )
    }
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: ChangePasswordRequest = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Update password
    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (passwordError) {
      return NextResponse.json(
        { error: passwordError.message },
        { status: 500 }
      )
    }

    // Get user role before updating profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'technician'

    // Update user profile to remove must_change_password flag
    const { error: updateProfileError } = await supabase
      .from('user_profiles')
      .update({ 
        must_change_password: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError)
      // Don't fail the request since password was changed successfully
    }

    // Clear user profile cache
    try {
      clearUserProfileCache(user.id)
    } catch (cacheError) {
      console.error('Error clearing cache:', cacheError)
      // Don't fail the request if cache clearing fails
    }

    // Get redirect path based on user role
    const redirectPath = getRedirectPath(userRole as UserRole, '/change-password')

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
      redirectPath
    })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
