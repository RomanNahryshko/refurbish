/**
 * Diagnostic utility for testing Supabase client optimization
 */

import { createSupabaseClient, getSupabaseClient } from '@/lib/supabase/client'
import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '@/lib/supabase'

export function testSupabaseClientOptimization() {
  console.log('🔍 Testing Supabase Client Optimization...')
  
  // Test 0: Check configuration
  console.log('Test 0: Checking Supabase configuration')
  console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing', supabaseUrl.substring(0, 30) + '...')
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Missing', supabaseAnonKey.substring(0, 20) + '...')
  console.log('Has valid config:', hasValidSupabaseConfig)
  
  // Test 1: Create client multiple times
  console.log('Test 1: Creating clients multiple times')
  const client1 = createSupabaseClient()
  const client2 = createSupabaseClient()
  const client3 = createSupabaseClient()
  
  console.log('Client 1:', client1 ? 'Created' : 'Failed')
  console.log('Client 2:', client2 ? 'Created' : 'Failed')
  console.log('Client 3:', client3 ? 'Created' : 'Failed')
  console.log('Are they the same instance?', client1 === client2 === client3)
  
  // Test 2: Get existing client
  console.log('\nTest 2: Getting existing client')
  const existingClient = getSupabaseClient()
  console.log('Existing client:', existingClient ? 'Found' : 'Not found')
  console.log('Is same as created?', client1 === existingClient)
  
  // Test 3: Test basic connection
  console.log('\nTest 3: Testing basic connection')
  if (client1) {
    client1.auth.getUser()
      .then(({ data, error }) => {
        if (error) {
          console.log('❌ Auth test failed:', error.message)
        } else {
          console.log('✅ Auth test passed:', data.user ? 'User found' : 'No user')
        }
      })
      .catch(err => {
        console.log('❌ Connection test failed:', err.message)
      })
  }
  
  return {
    clientsCreated: 3,
    sameInstance: client1 === client2,
    hasExistingClient: !!existingClient,
    client: client1
  }
}
