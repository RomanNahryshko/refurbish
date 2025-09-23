import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'
import { DeviceStatus, DeviceGrade } from '@/lib/types/business-types'

interface CreateDeviceData {
  imei: string
  brand: string
  model: string
  batch_id: string
  status?: DeviceStatus
  grade?: DeviceGrade
  notes?: string
}

export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const batchId = searchParams.get('batchId')
    const brand = searchParams.get('brand')
    const model = searchParams.get('model')
    const grade = searchParams.get('grade')
    const search = searchParams.get('search')

    // Build query with filters
    let query = supabase
      .from('devices')
      .select('*')

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (batchId) {
      query = query.eq('batch_id', batchId)
    }
    if (brand) {
      query = query.eq('brand', brand)
    }
    if (model) {
      query = query.eq('model', model)
    }
    if (grade) {
      query = query.eq('grade', grade)
    }
    if (search) {
      query = query.or(`internal_id.ilike.%${search}%,imei.ilike.%${search}%,serial_number.ilike.%${search}%,model.ilike.%${search}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching devices:', error)
      return NextResponse.json({ 
        error: `Failed to fetch devices: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Error in devices GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('devices', 'create')
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestData = await request.json()

    // Handle both single device and bulk device creation
    if (requestData.devices && Array.isArray(requestData.devices)) {
      // Bulk device creation
      const devicesWithUser = requestData.devices.map((device: CreateDeviceData) => ({
        ...device,
        created_by: user.id,
        updated_by: user.id
      }))

      const { data, error } = await supabase
        .from('devices')
        .insert(devicesWithUser)
        .select()

      if (error) {
        console.error('Error creating devices in bulk:', error)
        return NextResponse.json({ 
          error: `Failed to create devices: ${error.message}` 
        }, { status: 500 })
      }

      return NextResponse.json({ data })
    } else {
      // Single device creation
      const deviceWithUser = {
        ...requestData,
        created_by: user.id,
        updated_by: user.id
      }

      const { data, error } = await supabase
        .from('devices')
        .insert(deviceWithUser)
        .select()
        .single()

      if (error) {
        console.error('Error creating device:', error)
        return NextResponse.json({ 
          error: `Failed to create device: ${error.message}` 
        }, { status: 500 })
      }

      return NextResponse.json({ data })
    }
  } catch (error) {
    console.error('Error in devices POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('devices', 'update')
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json({ 
        error: 'Missing required field: id' 
      }, { status: 400 })
    }

    // Add updated_by field
    const updatesWithUser = {
      ...updates,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('devices')
      .update(updatesWithUser)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating device:', error)
      return NextResponse.json({ 
        error: `Failed to update device: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Error in devices PUT:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('devices', 'delete')
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        error: 'Missing required parameter: id' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting device:', error)
      return NextResponse.json({ 
        error: `Failed to delete device: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ message: 'Device deleted successfully' })

  } catch (error) {
    console.error('Error in devices DELETE:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

