/**
 * Debug utility to test admin client permissions
 * Run this to check if service role can access user_profiles table
 */

import { createAdminClient } from '@/lib/supabase/admin'

export async function testAdminPermissions() {
  console.log('🔍 Testing admin client permissions...')
  
  const adminClient = createAdminClient()
  
  if (!adminClient) {
    console.error('❌ Admin client not configured')
    return {
      success: false,
      error: 'Admin client not configured. Check SUPABASE_SERVICE_ROLE_KEY environment variable.'
    }
  }

  try {
    // Test 1: Check if we can read from user_profiles
    console.log('📖 Testing read access to user_profiles...')
    const { data: users, error: readError } = await adminClient
      .from('user_profiles')
      .select('id, full_name, role')
      .limit(1)

    if (readError) {
      console.error('❌ Read test failed:', readError.message)
      return {
        success: false,
        error: `Read access denied: ${readError.message}`,
        details: readError
      }
    }

    console.log('✅ Read access OK. Users found:', users?.length || 0)

    // Test 2: Check if we can write to user_profiles (dry run)
    console.log('✍️ Testing write access to user_profiles (dry run)...')
    
    // Try to insert a test record (we'll roll it back)
    const testProfile = {
      id: '00000000-0000-0000-0000-000000000000', // UUID that won't conflict
      full_name: 'Test User',
      role: 'technician' as const,
      status: 'active' as const,
      must_change_password: true,
      created_at: new Date().toISOString()
    }

    const { error: insertError } = await adminClient
      .from('user_profiles')
      .insert(testProfile)
      .select()

    if (insertError) {
      console.error('❌ Write test failed:', insertError.message)
      return {
        success: false,
        error: `Write access denied: ${insertError.message}`,
        details: insertError
      }
    }

    // Clean up test record
    await adminClient
      .from('user_profiles')
      .delete()
      .eq('id', testProfile.id)

    console.log('✅ Write access OK')

    // Test 3: Check auth.users access
    console.log('👤 Testing auth.users access...')
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Auth users test failed:', authError.message)
      return {
        success: false,
        error: `Auth access denied: ${authError.message}`,
        details: authError
      }
    }

    console.log('✅ Auth access OK. Auth users found:', authUsers.users?.length || 0)

    return {
      success: true,
      message: 'All permission tests passed',
      stats: {
        userProfiles: users?.length || 0,
        authUsers: authUsers.users?.length || 0
      }
    }

  } catch (error) {
    console.error('❌ Permission test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

// Export for use in API route or debug console
export async function runPermissionTest() {
  const result = await testAdminPermissions()
  console.log('🏁 Test completed:', result)
  return result
}
