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

    return NextResponse.json({ 
      data: statusHistory || [],
      message: 'Device status history fetched successfully'
    })

  } catch (error) {
    console.error('Error in device status history GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

