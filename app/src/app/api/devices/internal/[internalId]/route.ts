import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ internalId: string }> }
) {
  // Check permission
  const permissionCheck = await requirePermission('devices', 'read')
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { internalId } = await params

    if (!internalId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: internalId' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('internal_id', internalId)
      .single()

    if (error) {
      console.error('Error fetching device by internal_id:', error)
      return NextResponse.json({ 
        error: `Failed to fetch device: ${error.message}` 
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ 
        error: `Device with internal_id ${internalId} not found` 
      }, { status: 404 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Error in devices/internal/[internalId] GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}