import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'
import dayjs from 'dayjs'


export async function GET(request: NextRequest) {
  // Check permission - only Admin, General Manager, Operations Manager
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
    const technicianIds = searchParams.get('technicianIds')?.split(',').filter(Boolean)
    const brand = searchParams.get('brand')
    const model = searchParams.get('model')
    const repairTypes = searchParams.get('repairTypes')?.split(',').filter(Boolean)
    const batchId = searchParams.get('batchId')

    // Date range is required
    if (!dateFrom || !dateTo) {
      return NextResponse.json({ 
        error: 'Date range is required (dateFrom and dateTo)' 
      }, { status: 400 })
    }

    // Parse dates and set time boundaries
    const startDate = dayjs(dateFrom).startOf('day').toISOString()
    const endDate = dayjs(dateTo).endOf('day').toISOString()

    // Step 1: Get devices that passed Final QC in the date range
    // A device "passed Final QC" means it has a final QC check with overall_result = 'pass'
    // and the check was performed within the date range
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
          batch_id,
          batches:batch_id (
            id,
            batch_number
          )
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

    // Filter devices by brand/model/batch if specified
    let filteredDeviceIds = [...new Set((finalQCChecks || []).map(qc => qc.device_id).filter(Boolean))]
    
    // Don't return early here - we need to continue to get available brands/models even if no devices match
    // But we'll return empty results if no devices passed QC
    if (filteredDeviceIds.length === 0) {
      // Still return available brands/models structure for filters
      return NextResponse.json({
        data: {
          devicesCount: 0,
          jobsCount: 0,
          byTechnician: [],
          byModelBrand: [],
          byRepairType: [],
          byBatch: [],
          dateFrom,
          dateTo,
          availableBrands: [],
          availableModelsByBrand: {}
        }
      })
    }

    // If brand/model/batch filters are specified, filter devices first
    if (brand || model || batchId) {
      let devicesQuery = supabase
        .from('devices')
        .select('id')
        .in('id', filteredDeviceIds)
        .is('deleted_at', null)

      if (brand) {
        devicesQuery = devicesQuery.eq('brand', brand)
      }
      if (model) {
        devicesQuery = devicesQuery.eq('model', model)
      }
      if (batchId) {
        devicesQuery = devicesQuery.eq('batch_id', batchId)
      }

      const { data: filteredDevices, error: devicesError } = await devicesQuery
      if (devicesError) {
        console.error('Error filtering devices:', devicesError)
        return NextResponse.json({ 
          error: `Failed to filter devices: ${devicesError.message}` 
        }, { status: 500 })
      }

      filteredDeviceIds = (filteredDevices || []).map(d => d.id)
      
      if (filteredDeviceIds.length === 0) {
        // Return empty results but still include structure for filters
        return NextResponse.json({
          data: {
            devicesCount: 0,
            jobsCount: 0,
            byTechnician: [],
            byModelBrand: [],
            byRepairType: [],
            byBatch: [],
            dateFrom,
            dateTo,
            availableBrands: [],
            availableModelsByBrand: {}
          }
        })
      }
    }

    // Step 2: Get all repair jobs for these devices
    // Filter by completion date within range, and apply other filters
    let repairJobsQuery = supabase
      .from('repair_jobs')
      .select(`
        id,
        device_id,
        repair_type,
        status,
        assigned_to,
        completed_at,
        devices:device_id (
          id,
          brand,
          model,
          batch_id,
          batches:batch_id (
            id,
            batch_number
          )
        )
      `)
      .in('device_id', filteredDeviceIds)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate)
      .is('deleted_at', null)

    // Apply remaining filters
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

    const jobs = repairJobs || []

    // Step 2.5: Get technician profiles separately and enrich jobs
    const jobTechnicianIds = [...new Set(jobs.map(job => job.assigned_to).filter(Boolean))]
    const techniciansMap = new Map<string, { full_name: string; technician_level: string | null }>()
    
    if (jobTechnicianIds.length > 0) {
      const { data: technicians, error: techError } = await supabase
        .from('user_profiles')
        .select('id, full_name, technician_level')
        .in('id', jobTechnicianIds)
        .is('deleted_at', null)

      if (techError) {
        console.error('Error fetching technicians:', techError)
      } else {
        (technicians || []).forEach(tech => {
          techniciansMap.set(tech.id, {
            full_name: tech.full_name,
            technician_level: tech.technician_level
          })
        })
      }
    }

    // Enrich jobs with technician data
    const enrichedJobs = jobs.map(job => ({
      ...job,
      assigned_user: job.assigned_to ? techniciansMap.get(job.assigned_to) || null : null
    }))

    // Step 3: Calculate metrics
    // According to requirements:
    // - "Devices: count unique devices that passed Final QC in the selected date range"
    // - "Jobs: count completed repair jobs in the selected date range"
    // - "Device repaired by technician means the technician completed at least one repair job on that device"
    // - "devices counted only if they subsequently passed Final QC in-range"
    //
    // Interpretation:
    // - Devices count: ALL unique devices that passed Final QC in the date range (regardless of when jobs were completed)
    // - Jobs count: completed repair jobs in the selected date range (for devices that passed Final QC in range)
    //
    // Note: Devices are counted if they passed Final QC in range, even if their repair jobs were completed outside the range.
    // Jobs are only counted if completed within the date range.
    
    // Devices count: all devices that passed Final QC in the range (filteredDeviceIds)
    // This is the correct interpretation: "count unique devices that passed Final QC in the selected date range"
    const devicesCount = filteredDeviceIds.length
    
    // Jobs count: only jobs completed in the date range
    const jobsCount = enrichedJobs.length

    // Step 5: Group by Technician
    const byTechnicianMap = new Map<string, { jobs: number; devices: Set<string> }>()
    enrichedJobs.forEach(job => {
      const technicianId = job.assigned_to
      if (!technicianId) return

      const techName = job.assigned_user?.full_name || 'Unknown'
      const techLevel = job.assigned_user?.technician_level || ''
      const key = `${technicianId}|${techName}|${techLevel}`

      if (!byTechnicianMap.has(key)) {
        byTechnicianMap.set(key, { jobs: 0, devices: new Set() })
      }
      const entry = byTechnicianMap.get(key)!
      entry.jobs++
      entry.devices.add(job.device_id)
    })

    const byTechnician = Array.from(byTechnicianMap.entries())
      .map(([key, data]) => {
        const [id, name, level] = key.split('|')
        return {
          technicianId: id,
          technicianName: name,
          technicianLevel: level,
          jobs: data.jobs,
          devices: data.devices.size
        }
      })
      .sort((a, b) => b.jobs - a.jobs)

    // Step 6: Group by Model/Brand
    const byModelBrandMap = new Map<string, { jobs: number }>()
    enrichedJobs.forEach(job => {
      const device = job.devices as any
      const brand = device?.brand || 'Unknown'
      const model = device?.model || 'Unknown'
      const key = `${brand}|${model}`

      if (!byModelBrandMap.has(key)) {
        byModelBrandMap.set(key, { jobs: 0 })
      }
      byModelBrandMap.get(key)!.jobs++
    })

    const byModelBrand = Array.from(byModelBrandMap.entries())
      .map(([key, data]) => {
        const [brand, model] = key.split('|')
        return {
          brand,
          model,
          jobs: data.jobs
        }
      })
      .sort((a, b) => b.jobs - a.jobs)

    // Step 7: Group by Repair Type
    const byRepairTypeMap = new Map<string, number>()
    enrichedJobs.forEach(job => {
      const repairType = job.repair_type
      byRepairTypeMap.set(repairType, (byRepairTypeMap.get(repairType) || 0) + 1)
    })

    const byRepairType = Array.from(byRepairTypeMap.entries())
      .map(([repairType, jobs]) => ({
        repairType,
        jobs
      }))
      .sort((a, b) => b.jobs - a.jobs)

    // Step 8: Group by Batch
    const byBatchMap = new Map<string, { devices: Set<string>; jobs: number }>()
    enrichedJobs.forEach(job => {
      const device = job.devices as any
      const batch = device?.batches
      const batchId = batch?.id
      const batchNumber = batch?.batch_number || 'Unknown'

      if (!batchId) return

      const key = `${batchId}|${batchNumber}`
      if (!byBatchMap.has(key)) {
        byBatchMap.set(key, { devices: new Set(), jobs: 0 })
      }
      const entry = byBatchMap.get(key)!
      entry.jobs++
      entry.devices.add(job.device_id)
    })

    const byBatch = Array.from(byBatchMap.entries())
      .map(([key, data]) => {
        const [id, number] = key.split('|')
        return {
          batchId: id,
          batchNumber: number,
          devices: data.devices.size,
          jobs: data.jobs
        }
      })
      .sort((a, b) => b.jobs - a.jobs)

    // Get all available brands and models for the date range (for filter dropdowns)
    // This should include all devices that passed Final QC, regardless of other filters
    const { data: allDevicesForFilters, error: devicesFilterError } = await supabase
      .from('devices')
      .select('brand, model')
      .in('id', [...new Set((finalQCChecks || []).map(qc => qc.device_id).filter(Boolean))])
      .is('deleted_at', null)
      .not('brand', 'is', null)
      .not('model', 'is', null)

    if (devicesFilterError) {
      console.error('Error fetching devices for filters:', devicesFilterError)
    }

    const devicesArray = Array.isArray(allDevicesForFilters) ? allDevicesForFilters : []
    const allBrands = [...new Set(devicesArray.map(d => d.brand).filter(Boolean))]
    const allModelsByBrand = new Map<string, string[]>()
    
    devicesArray.forEach(device => {
      if (device.brand && device.model) {
        if (!allModelsByBrand.has(device.brand)) {
          allModelsByBrand.set(device.brand, [])
        }
        const models = allModelsByBrand.get(device.brand)!
        if (!models.includes(device.model)) {
          models.push(device.model)
        }
      }
    })

    // Convert Map to object for JSON serialization
    const modelsByBrand: Record<string, string[]> = {}
    allModelsByBrand.forEach((models, brand) => {
      modelsByBrand[brand] = models.sort()
    })

    return NextResponse.json({
      data: {
        devicesCount,
        jobsCount,
        byTechnician,
        byModelBrand,
        byRepairType,
        byBatch,
        dateFrom,
        dateTo,
        availableBrands: allBrands.sort(),
        availableModelsByBrand: modelsByBrand
      }
    })

  } catch (error) {
    console.error('Error in device refurbishing report:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

