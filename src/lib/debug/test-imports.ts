/**
 * Test imports to debug API import issues
 */

import { devicesApi } from '@/lib/api/devices'
import { batchesApi } from '@/lib/api/batches'
import { suppliersApi } from '@/lib/api/suppliers'

export function testImports() {
  // Test devices API
  
  // Test batches API
  
  // Test suppliers API
  
  // Test method calls
  try {
    if (devicesApi?.getDevicesForFinalQC) {
      // Method is available
    }
  } catch (error) {
    // Method has issues
  }
  
  try {
    if (batchesApi?.getAll) {
      // Method is available
    }
  } catch (error) {
    // Method has issues
  }
  
  return {
    devicesApi: !!devicesApi,
    batchesApi: !!batchesApi,
    suppliersApi: !!suppliersApi
  }
}
