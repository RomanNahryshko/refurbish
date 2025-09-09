import { NextRequest, NextResponse } from 'next/server'
import { createUsersAPI } from '@/lib/api/users'
import { checkPermission } from '@/lib/services/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// GET /api/admin/users - List users
export async function GET(request: NextRequest) {
  // Check authentication
  const supabase = await createSupabaseServerClient()
  
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 })
  }
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('Auth error in /api/admin/users:', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check permission
  if (!await checkPermission(user.id, 'user_profiles', 'read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    }

    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    )

    const usersApi = createUsersAPI(supabase)
    const users = await usersApi.getAll(Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined)
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create user
export async function POST(request: NextRequest) {
  // Check authentication
  const supabase = await createSupabaseServerClient()
  
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 })
  }
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('Auth error in POST /api/admin/users:', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check permission
  if (!await checkPermission(user.id, 'user_profiles', 'create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { userData, performedBy } = body

    if (!userData?.email || !userData?.role || !userData?.full_name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, role, full_name' },
        { status: 400 }
      )
    }

    const usersApi = createUsersAPI(supabase)
    const result = await usersApi.create(userData, performedBy)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    )
  }
}