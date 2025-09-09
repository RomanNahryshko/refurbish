import { NextRequest, NextResponse } from 'next/server'
import { createInventoryAPI } from '@/lib/api/inventory'
import { requirePermission } from '@/lib/services/auth-helpers'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// GET /api/inventory/parts/[id] - Get part by ID (all authenticated users can view)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only require authentication for viewing
  const authError = await requirePermission('spare_parts', 'read')
  if (authError) return authError

  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const inventoryApi = createInventoryAPI(supabase)
    const part = await inventoryApi.getPartById(id)
    
    return NextResponse.json(part)
  } catch (error) {
    console.error('Error fetching part:', error)
    return NextResponse.json(
      { error: 'Failed to fetch part' },
      { status: 500 }
    )
  }
}

// PUT /api/inventory/parts/[id] - Update part (ops_manager/admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission for updating parts
  const authError = await requirePermission('spare_parts', 'update')
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const partData = body

    const supabase = await createSupabaseServerClient()
    const inventoryApi = createInventoryAPI(supabase)
    const result = await inventoryApi.updatePart(id, partData)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating part:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update part' },
      { status: 500 }
    )
  }
}

// DELETE /api/inventory/parts/[id] - Delete part (ops_manager/admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission for deleting parts
  const authError = await requirePermission('spare_parts', 'delete')
  if (authError) return authError

  try {
    const { id } = await params
    console.log(`Attempting to delete spare part with ID: ${id}`)
    
    const supabase = await createSupabaseServerClient()
    
    // Get user info for additional logging
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      console.log(`User ${user.id} (${user.email}) attempting to delete spare part`)
    }
    
    const inventoryApi = createInventoryAPI(supabase)
    
    // Check if part exists before deletion
    const { data: existingPart, error: checkError } = await supabase
      .from('spare_parts')
      .select('id, name, sku')
      .eq('id', id)
      .is('deleted_at', null)
      .single()
    
    if (checkError || !existingPart) {
      console.error('Part not found or already deleted:', { id, error: checkError })
      return NextResponse.json(
        { error: 'Part not found or already deleted' },
        { status: 404 }
      )
    }
    
    // Check if part is used in any repair jobs
    const { data: repairUsage, error: usageError } = await supabase
      .from('repair_parts_used')
      .select('id, repair_job_id')
      .eq('spare_part_id', id)
      .limit(1)
    
    if (usageError) {
      console.error('Error checking part usage:', usageError)
    } else if (repairUsage && repairUsage.length > 0) {
      console.error('Cannot delete part - it is used in repair jobs:', repairUsage)
      return NextResponse.json(
        { error: 'Cannot delete part - it is used in repair jobs. Consider archiving instead.' },
        { status: 400 }
      )
    }
    
    console.log(`Deleting part: ${existingPart.name} (SKU: ${existingPart.sku})`)
    await inventoryApi.deletePart(id)
    
    console.log(`Successfully deleted part: ${id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting part:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete part' },
      { status: 500 }
    )
  }
}
