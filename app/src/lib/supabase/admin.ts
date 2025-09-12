import { createClient } from '@supabase/supabase-js'

// Admin client using service role key for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

let adminClient: ReturnType<typeof createClient> | null = null

export function createSupabaseAdminClient() {
  // Debug environment variables
  console.log('🔧 Admin Client Debug:', {
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    supabaseServiceKey: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'MISSING',
    urlLength: supabaseUrl.length,
    serviceKeyLength: supabaseServiceKey.length,
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey
  })

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Admin Client: Missing required environment variables')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    return null
  }

  // Validate service key format
  if (!supabaseServiceKey.startsWith('eyJ')) {
    console.error('❌ Admin Client: Invalid service key format. Should start with "eyJ"')
    return null
  }

  if (!adminClient) {
    try {
      adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      console.log('✅ Admin Client: Created successfully')
    } catch (error) {
      console.error('❌ Admin Client: Failed to create client:', error)
      return null
    }
  }

  return adminClient
}

/**
 * Generate a secure temporary password
 */
export function generateTemporaryPassword(): string {
  const length = 12
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  
  // Ensure at least one character from each type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)] // uppercase
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)] // lowercase  
  password += "0123456789"[Math.floor(Math.random() * 10)] // number
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)] // special
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}