import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'
import dayjs from 'dayjs'

const DEVICE_ID_CHUNK_SIZE = 50
const MAX_CONCURRENT_CHUNKS = 3

interface DeviceMetadata {
  brand: string | null
  model: string | null
  batchId: string | null
  batchNumber: string | null
}

interface QueryFilters {
  dateFrom: string
  dateTo: string
  technicianIds?: string[]
  brand?: string
  model?: string
  repairTypes?: string[]
  batchId?: string
}

interface TechnicianProfile {
  full_name: string
  technician_level: string | null
}

interface EnrichedJob {
  id: string
  device_id: string
  repair_type: string
  status: string
  assigned_to: string
  completed_at: string
  assigned_user: TechnicianProfile | null
  devices: {
    id: string
    brand: string | null
    model: string | null
    batch_id: string | null
    batches: { id: string; batch_number: string | null } | null
  } | null
}

// Utility functions
function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) return [items]
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize))
  }
  return chunks
}

function buildDeviceMetadata(finalQCChecks: any[]): Map<string, DeviceMetadata> {
  const metadata = new Map<string, DeviceMetadata>()
  
  for (const check of finalQCChecks) {
    if (!check?.device_id) continue
    
    const device = check.devices || {}
    metadata.set(check.device_id, {
      brand: device.brand ?? null,
      model: device.model ?? null,
      batchId: device.batch_id ?? null,
      batchNumber: device.batches?.batch_number ?? null
    })
  }
  
  return metadata
}

function extractAvailableFilters(devicesMetadata: Map<string, DeviceMetadata>) {
  const brandSet = new Set<string>()
  const modelsByBrand = new Map<string, Set<string>>()

  for (const device of devicesMetadata.values()) {
    if (!device.brand) continue
    
    brandSet.add(device.brand)
    
    if (device.model) {
      if (!modelsByBrand.has(device.brand)) {
        modelsByBrand.set(device.brand, new Set())
      }
      modelsByBrand.get(device.brand)!.add(device.model)
    }
  }

  const availableBrands = [...brandSet].sort()
  const availableModelsByBrand: Record<string, string[]> = {}
  
  for (const [brand, models] of modelsByBrand) {
    availableModelsByBrand[brand] = [...models].sort()
  }

  return { availableBrands, availableModelsByBrand }
}

function filterDevicesByMetadata(
  deviceIds: string[],
  metadata: Map<string, DeviceMetadata>,
  filters: Pick<QueryFilters, 'brand' | 'model' | 'batchId'>
): string[] {
  const { brand, model, batchId } = filters
  
  if (!brand && !model && !batchId) {
    return deviceIds
  }

  return deviceIds.filter(deviceId => {
    const deviceMetadata = metadata.get(deviceId)
    if (!deviceMetadata) return false
    if (brand && deviceMetadata.brand !== brand) return false
    if (model && deviceMetadata.model !== model) return false
    if (batchId && deviceMetadata.batchId !== batchId) return false
    return true
  })
}

function parseQueryParameters(searchParams: URLSearchParams): QueryFilters | { error: string } {
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  if (!dateFrom || !dateTo) {
    return { error: 'Date range is required (dateFrom and dateTo)' }
  }

  return {
    dateFrom,
    dateTo,
    technicianIds: searchParams.get('technicianIds')?.split(',').filter(Boolean),
    brand: searchParams.get('brand') || undefined,
    model: searchParams.get('model') || undefined,
    repairTypes: searchParams.get('repairTypes')?.split(',').filter(Boolean),
    batchId: searchParams.get('batchId') || undefined
  }
}

async function fetchFinalQCChecks(supabase: any, startDate: string, endDate: string) {
  const { data, error } = await supabase
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

  if (error) {
    throw new Error(`Failed to fetch QC data: ${error.message}`)
  }

  return data || []
}

async function fetchRepairJobsForDevices(
  supabase: any,
  deviceIds: string[],
  filters: QueryFilters,
  startDate: string,
  endDate: string
): Promise<any[]> {
  const jobs: any[] = []
  const deviceIdChunks = chunkArray(deviceIds, DEVICE_ID_CHUNK_SIZE)

  for (let i = 0; i < deviceIdChunks.length; i += MAX_CONCURRENT_CHUNKS) {
    const chunkBatch = deviceIdChunks.slice(i, i + MAX_CONCURRENT_CHUNKS)
    
    const chunkPromises = chunkBatch.map(async (deviceChunk) => {
      let query = supabase
        .from('repair_jobs')
        .select('id, device_id, repair_type, status, assigned_to, completed_at')
        .in('device_id', deviceChunk)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .gte('completed_at', startDate)
        .lte('completed_at', endDate)
        .is('deleted_at', null)

      if (filters.technicianIds?.length) {
        query = query.in('assigned_to', filters.technicianIds)
      }
      if (filters.repairTypes?.length) {
        query = query.in('repair_type', filters.repairTypes)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch repair jobs: ${error.message}`)
      }

      return data || []
    })

    const chunkResults = await Promise.all(chunkPromises)
    jobs.push(...chunkResults.flat())
  }

  return jobs
}

async function fetchTechnicians(supabase: any, technicianIds: string[]): Promise<Map<string, TechnicianProfile>> {
  const techniciansMap = new Map<string, TechnicianProfile>()
  
  if (technicianIds.length === 0) {
    return techniciansMap
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, technician_level')
    .in('id', technicianIds)
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching technicians:', error)
    return techniciansMap
  }

  for (const tech of data || []) {
    techniciansMap.set(tech.id, {
      full_name: tech.full_name,
      technician_level: tech.technician_level
    })
  }

  return techniciansMap
}

function enrichJobs(
  jobs: any[],
  devicesMetadata: Map<string, DeviceMetadata>,
  techniciansMap: Map<string, TechnicianProfile>
): EnrichedJob[] {
  return jobs.map(job => {
    const deviceMetadata = devicesMetadata.get(job.device_id)
    
    return {
      ...job,
      assigned_user: job.assigned_to ? techniciansMap.get(job.assigned_to) || null : null,
      devices: deviceMetadata ? {
        id: job.device_id,
        brand: deviceMetadata.brand,
        model: deviceMetadata.model,
        batch_id: deviceMetadata.batchId,
        batches: deviceMetadata.batchId ? {
          id: deviceMetadata.batchId,
          batch_number: deviceMetadata.batchNumber
        } : null
      } : null
    }
  })
}

function groupByTechnician(jobs: EnrichedJob[]) {
  const byTechnicianMap = new Map<string, { jobs: number; devices: Set<string> }>()
  
  for (const job of jobs) {
    if (!job.assigned_to) continue

    const techName = job.assigned_user?.full_name || 'Unknown'
    const techLevel = job.assigned_user?.technician_level || ''
    const key = `${job.assigned_to}|${techName}|${techLevel}`

    if (!byTechnicianMap.has(key)) {
      byTechnicianMap.set(key, { jobs: 0, devices: new Set() })
    }
    
    const entry = byTechnicianMap.get(key)!
    entry.jobs++
    entry.devices.add(job.device_id)
  }

  return Array.from(byTechnicianMap.entries())
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
}

function groupByModelBrand(jobs: EnrichedJob[]) {
  const byModelBrandMap = new Map<string, { jobs: number }>()
  
  for (const job of jobs) {
    const device = job.devices
    const brand = device?.brand || 'Unknown'
    const model = device?.model || 'Unknown'
    const key = `${brand}|${model}`

    if (!byModelBrandMap.has(key)) {
      byModelBrandMap.set(key, { jobs: 0 })
    }
    byModelBrandMap.get(key)!.jobs++
  }

  return Array.from(byModelBrandMap.entries())
    .map(([key, data]) => {
      const [brand, model] = key.split('|')
      return { brand, model, jobs: data.jobs }
    })
    .sort((a, b) => b.jobs - a.jobs)
}

function groupByRepairType(jobs: EnrichedJob[]) {
  const byRepairTypeMap = new Map<string, number>()
  
  for (const job of jobs) {
    const count = byRepairTypeMap.get(job.repair_type) || 0
    byRepairTypeMap.set(job.repair_type, count + 1)
  }

  return Array.from(byRepairTypeMap.entries())
    .map(([repairType, jobs]) => ({ repairType, jobs }))
    .sort((a, b) => b.jobs - a.jobs)
}

function groupByBatch(jobs: EnrichedJob[]) {
  const byBatchMap = new Map<string, { devices: Set<string>; jobs: number }>()
  
  for (const job of jobs) {
    const device = job.devices
    const batch = device?.batches
    const batchId = batch?.id
    const batchNumber = batch?.batch_number || 'Unknown'

    if (!batchId) continue

    const key = `${batchId}|${batchNumber}`
    if (!byBatchMap.has(key)) {
      byBatchMap.set(key, { devices: new Set(), jobs: 0 })
    }
    
    const entry = byBatchMap.get(key)!
    entry.jobs++
    entry.devices.add(job.device_id)
  }

  return Array.from(byBatchMap.entries())
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
}

function createEmptyResponse(
  dateFrom: string,
  dateTo: string,
  availableBrands: string[],
  availableModelsByBrand: Record<string, string[]>
) {
  return {
    devicesCount: 0,
    jobsCount: 0,
    byTechnician: [],
    byModelBrand: [],
    byRepairType: [],
    byBatch: [],
    dateFrom,
    dateTo,
    availableBrands,
    availableModelsByBrand
  }
}

export async function GET(request: NextRequest) {
  const permissionCheck = await requirePermission('devices', 'read')
  if (permissionCheck) return permissionCheck

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const filters = parseQueryParameters(searchParams)
    
    if ('error' in filters) {
      return NextResponse.json({ error: filters.error }, { status: 400 })
    }

    // Set date boundaries
    const startDate = dayjs(filters.dateFrom).startOf('day').toISOString()
    const endDate = dayjs(filters.dateTo).endOf('day').toISOString()

    // Fetch devices that passed Final QC
    const finalQCChecks = await fetchFinalQCChecks(supabase, startDate, endDate)
    const devicesMetadata = buildDeviceMetadata(finalQCChecks)
    const { availableBrands, availableModelsByBrand } = extractAvailableFilters(devicesMetadata)

    // Apply filters
    let filteredDeviceIds = [...devicesMetadata.keys()]
    filteredDeviceIds = filterDevicesByMetadata(filteredDeviceIds, devicesMetadata, filters)

    if (filteredDeviceIds.length === 0) {
      return NextResponse.json({
        data: createEmptyResponse(filters.dateFrom, filters.dateTo, availableBrands, availableModelsByBrand)
      })
    }

    // Fetch repair jobs
    const jobs = await fetchRepairJobsForDevices(supabase, filteredDeviceIds, filters, startDate, endDate)

    // Fetch technician profiles
    const jobTechnicianIds = [...new Set(jobs.map(job => job.assigned_to).filter(Boolean))]
    const techniciansMap = await fetchTechnicians(supabase, jobTechnicianIds)

    // Enrich jobs with technician and device data
    const enrichedJobs = enrichJobs(jobs, devicesMetadata, techniciansMap)

    // Calculate metrics
    const devicesCount = filteredDeviceIds.length
    const jobsCount = enrichedJobs.length
    const byTechnician = groupByTechnician(enrichedJobs)
    const byModelBrand = groupByModelBrand(enrichedJobs)
    const byRepairType = groupByRepairType(enrichedJobs)
    const byBatch = groupByBatch(enrichedJobs)

    return NextResponse.json({
      data: {
        devicesCount,
        jobsCount,
        byTechnician,
        byModelBrand,
        byRepairType,
        byBatch,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        availableBrands,
        availableModelsByBrand
      }
    })

  } catch (error) {
    console.error('Error in device refurbishing report:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}