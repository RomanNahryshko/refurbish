/**
 * Diagnostic utility for testing Supabase client optimization
 */

import { createSupabaseClient, getSupabaseClient } from '@/lib/supabase/client'

export function testSupabaseClientOptimization() {
  // Test 0: Check configuration
  
  // Test 1: Create client multiple times
  const client1 = createSupabaseClient()
  const client2 = createSupabaseClient()
  const client3 = createSupabaseClient()
  
  // Test 2: Get existing client
  const existingClient = getSupabaseClient()
  
  // Test 3: Test basic connection
  if (client1) {
    client1.auth.getUser()
      .then(({ data, error }) => {
        // Auth test completed
      })
      .catch(err => {
        // Connection test failed
      })
  }
  
  return {
    clientsCreated: 3,
    sameInstance: client1 === client2,
    hasExistingClient: !!existingClient,
    client: client1
  }
}
