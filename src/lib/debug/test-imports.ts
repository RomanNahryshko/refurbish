/**
 * Test imports to debug API import issues
 */

import { devicesApi } from '@/lib/api/devices'
import { batchesApi } from '@/lib/api/batches'
import { suppliersApi } from '@/lib/api/suppliers'

export function testImports() {
  console.log('🔍 Testing API imports...')
  
  // Test devices API
  console.log('Devices API:', {
    exists: !!devicesApi,
    type: typeof devicesApi,
    methods: devicesApi ? Object.getOwnPropertyNames(Object.getPrototypeOf(devicesApi)) : 'N/A',
    getDevicesForFinalQC: devicesApi?.getDevicesForFinalQC ? 'Available' : 'Missing'
  })
  
  // Test batches API
  console.log('Batches API:', {
    exists: !!batchesApi,
    type: typeof batchesApi,
    methods: batchesApi ? Object.getOwnPropertyNames(Object.getPrototypeOf(batchesApi)) : 'N/A',
    getAll: batchesApi?.getAll ? 'Available' : 'Missing'
  })
  
  // Test suppliers API
  console.log('Suppliers API:', {
    exists: !!suppliersApi,
    type: typeof suppliersApi,
    methods: suppliersApi ? Object.getOwnPropertyNames(Object.getPrototypeOf(suppliersApi)) : 'N/A',
    getAll: suppliersApi?.getAll ? 'Available' : 'Missing'
  })
  
  // Test method calls
  try {
    if (devicesApi?.getDevicesForFinalQC) {
      console.log('✅ devicesApi.getDevicesForFinalQC is callable')
    } else {
      console.log('❌ devicesApi.getDevicesForFinalQC is not callable')
    }
  } catch (error) {
    console.log('❌ Error testing devicesApi.getDevicesForFinalQC:', error)
  }
  
  try {
    if (batchesApi?.getAll) {
      console.log('✅ batchesApi.getAll is callable')
    } else {
      console.log('❌ batchesApi.getAll is not callable')
    }
  } catch (error) {
    console.log('❌ Error testing batchesApi.getAll:', error)
  }
  
  return {
    devicesApi: !!devicesApi,
    batchesApi: !!batchesApi,
    suppliersApi: !!suppliersApi
  }
}
