/**
 * API Health Check utility
 * Tests all major API endpoints to ensure they work with optimized clients
 */

import { batchesApi } from '@/lib/api/batches'
import { devicesApi } from '@/lib/api/devices'
import { suppliersApi } from '@/lib/api/suppliers'

export async function performAPIHealthCheck() {
  console.log('🔍 Performing API Health Check...')
  
  const results = {
    batches: { status: 'pending', error: null as any, data: null as any },
    devices: { status: 'pending', error: null as any, data: null as any },
    devicesForQC: { status: 'pending', error: null as any, data: null as any },
    suppliers: { status: 'pending', error: null as any, data: null as any },
  }
  
  // Test batches API
  try {
    console.log('Testing batches API...')
    const batchesData = await batchesApi.getAll()
    results.batches.status = 'success'
    results.batches.data = batchesData
    console.log('✅ Batches API: OK', `${batchesData.length} batches`)
  } catch (error) {
    results.batches.status = 'error'
    results.batches.error = error
    console.log('❌ Batches API: Failed', error)
  }
  
  // Test devices API
  try {
    console.log('Testing devices API...')
    const devicesData = await devicesApi.getAll()
    results.devices.status = 'success'
    results.devices.data = devicesData
    console.log('✅ Devices API: OK', `${devicesData.length} devices`)
  } catch (error) {
    results.devices.status = 'error'
    results.devices.error = error
    console.log('❌ Devices API: Failed', error)
  }
  
  // Test devices for QC API
  try {
    console.log('Testing devices for QC API...')
    const qcDevicesData = await devicesApi.getDevicesForFinalQC()
    results.devicesForQC.status = 'success'
    results.devicesForQC.data = qcDevicesData
    console.log('✅ Devices for QC API: OK', `${qcDevicesData.length} devices ready for QC`)
  } catch (error) {
    results.devicesForQC.status = 'error'
    results.devicesForQC.error = error
    console.log('❌ Devices for QC API: Failed', error)
  }
  
  // Test suppliers API
  try {
    console.log('Testing suppliers API...')
    const suppliersData = await suppliersApi.getAll()
    results.suppliers.status = 'success'
    results.suppliers.data = suppliersData
    console.log('✅ Suppliers API: OK', `${suppliersData.length} suppliers`)
  } catch (error) {
    results.suppliers.status = 'error'
    results.suppliers.error = error
    console.log('❌ Suppliers API: Failed', error)
  }
  
  // Summary
  const successCount = Object.values(results).filter(r => r.status === 'success').length
  const totalCount = Object.values(results).length
  
  console.log(`\n📊 API Health Check Summary: ${successCount}/${totalCount} APIs working`)
  
  if (successCount === totalCount) {
    console.log('🎉 All APIs are working correctly with optimized Supabase clients!')
  } else {
    console.log('⚠️ Some APIs are failing. Check the details above.')
  }
  
  return results
}
