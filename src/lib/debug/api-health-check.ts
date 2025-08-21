/**
 * API Health Check utility
 * Tests all major API endpoints to ensure they work with optimized clients
 */

import { batchesApi } from '@/lib/api/batches'
import { devicesApi } from '@/lib/api/devices'
import { suppliersApi } from '@/lib/api/suppliers'

export async function performAPIHealthCheck() {
  const results = {
    batches: { status: 'pending', error: null as any, data: null as any },
    devices: { status: 'pending', error: null as any, data: null as any },
    devicesForQC: { status: 'pending', error: null as any, data: null as any },
    suppliers: { status: 'pending', error: null as any, data: null as any },
  }
  
  // Test batches API
  try {
    const batchesData = await batchesApi.getAll()
    results.batches.status = 'success'
    results.batches.data = batchesData
  } catch (error) {
    results.batches.status = 'error'
    results.batches.error = error
  }
  
  // Test devices API
  try {
    const devicesData = await devicesApi.getAll()
    results.devices.status = 'success'
    results.devices.data = devicesData
  } catch (error) {
    results.devices.status = 'error'
    results.devices.error = error
  }
  
  // Test devices for QC API
  try {
    const qcDevicesData = await devicesApi.getDevicesForFinalQC()
    results.devicesForQC.status = 'success'
    results.devicesForQC.data = qcDevicesData
  } catch (error) {
    results.devicesForQC.status = 'error'
    results.devicesForQC.error = error
  }
  
  // Test suppliers API
  try {
    const suppliersData = await suppliersApi.getAll()
    results.suppliers.status = 'success'
    results.suppliers.data = suppliersData
  } catch (error) {
    results.suppliers.status = 'error'
    results.suppliers.error = error
  }
  
  // Summary
  const successCount = Object.values(results).filter(r => r.status === 'success').length
  const totalCount = Object.values(results).length
  
  return results
}
