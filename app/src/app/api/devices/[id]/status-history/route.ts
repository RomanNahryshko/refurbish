import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission
  const permissionCheck = await requirePermission('devices', 'read')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get device status history
    const { data: statusHistory, error } = await supabase
      .from('device_status_history')
      .select('*')
      .eq('device_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching device status history:', error)
      return NextResponse.json({ 
        error: `Failed to fetch status history: ${error.message}` 
      }, { status: 500 })
    }

    // Manually fetch user profiles for each unique changed_by ID
    // This is necessary because changed_by references auth.users, not user_profiles directly
    const uniqueUserIds = [...new Set(
      (statusHistory || [])
        .map(h => h.changed_by)
        .filter(Boolean)
    )]

    let userProfilesMap: Record<string, { id: string; full_name: string; email: string }> = {}

    if (uniqueUserIds.length > 0) {
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', uniqueUserIds)

      if (userProfiles) {
        userProfilesMap = Object.fromEntries(
          userProfiles.map(profile => [profile.id, profile])
        )
      }
    }

    // Attach user profiles to history entries
    const enrichedHistory = (statusHistory || []).map(history => ({
      ...history,
      user_profile: history.changed_by ? userProfilesMap[history.changed_by] || null : null
    }))

    return NextResponse.json({ 
      data: enrichedHistory,
      message: 'Device status history fetched successfully'
    })

  } catch (error) {
    console.error('Error in device status history GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

