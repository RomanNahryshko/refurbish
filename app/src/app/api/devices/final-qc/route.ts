import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'
import dayjs from 'dayjs'

export async function GET(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('devices', 'read')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const brand = searchParams.get('brand')
    const model = searchParams.get('model')
    const batchId = searchParams.get('batchId')
    const technicianIds = searchParams.get('technicianIds')?.split(',').filter(Boolean)
    const repairTypes = searchParams.get('repairTypes')?.split(',').filter(Boolean)

    // Date range is required
    if (!dateFrom || !dateTo) {
      return NextResponse.json({ 
        error: 'Date range is required (dateFrom and dateTo)' 
      }, { status: 400 })
    }

    // Parse dates and set time boundaries
    const startDate = dayjs(dateFrom).startOf('day').toISOString()
    const endDate = dayjs(dateTo).endOf('day').toISOString()

    // Get devices that passed Final QC in the date range
    const { data: finalQCChecks, error: qcError } = await supabase
      .from('qc_checks')
      .select(`
        id,
        device_id,
        performed_at,
        devices:device_id (
          id,
          internal_id,
          imei,
          brand,
          model,
          color,
          storage_capacity,
          batch_id
        )
      `)
      .eq('check_type', 'final')
      .eq('overall_result', 'pass')
      .not('performed_at', 'is', null)
      .gte('performed_at', startDate)
      .lte('performed_at', endDate)

    if (qcError) {
      console.error('Error fetching final QC checks:', qcError)
      return NextResponse.json({ 
        error: `Failed to fetch QC data: ${qcError.message}` 
      }, { status: 500 })
    }

    // Extract unique devices
    const devicesMap = new Map<string, any>()
    if (finalQCChecks) {
      finalQCChecks.forEach(qc => {
        if (qc.devices && !devicesMap.has(qc.device_id)) {
          devicesMap.set(qc.device_id, qc.devices)
        }
      })
    }

    let devices = Array.from(devicesMap.values())

    // Apply filters
    if (brand) {
      devices = devices.filter(d => d.brand === brand)
    }
    if (model) {
      devices = devices.filter(d => d.model === model)
    }
    if (batchId) {
      devices = devices.filter(d => d.batch_id === batchId)
    }

    // If technician or repair type filters are specified, filter by repair jobs
    if ((technicianIds && technicianIds.length > 0) || (repairTypes && repairTypes.length > 0)) {
      const deviceIds = devices.map(d => d.id)
      
      let repairJobsQuery = supabase
        .from('repair_jobs')
        .select('device_id')
        .in('device_id', deviceIds)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .gte('completed_at', startDate)
        .lte('completed_at', endDate)
        .is('deleted_at', null)

      if (technicianIds && technicianIds.length > 0) {
        repairJobsQuery = repairJobsQuery.in('assigned_to', technicianIds)
      }
      if (repairTypes && repairTypes.length > 0) {
        repairJobsQuery = repairJobsQuery.in('repair_type', repairTypes)
      }

      const { data: repairJobs, error: jobsError } = await repairJobsQuery

      if (jobsError) {
        console.error('Error fetching repair jobs:', jobsError)
        return NextResponse.json({ 
          error: `Failed to fetch repair jobs: ${jobsError.message}` 
        }, { status: 500 })
      }

      const jobDeviceIds = new Set((repairJobs || []).map(job => job.device_id))
      devices = devices.filter(d => jobDeviceIds.has(d.id))
    }

    return NextResponse.json({ 
      data: devices,
      message: 'Devices fetched successfully' 
    })

  } catch (error) {
    console.error('Error in devices final-qc GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

