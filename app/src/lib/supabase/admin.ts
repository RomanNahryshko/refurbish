import { createClient } from '@supabase/supabase-js'

// Admin client using service role key for privileged operations
// Use direct Supabase URL if available, otherwise fallback to proxy URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || ''
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

  // Debug all Supabase environment variables
  const envDebugInfo = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'MISSING',
    NEXT_PUBLIC_SUPABASE_PROXY_URL: process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL.substring(0, 30)}...` : 'MISSING',
    selectedUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    urlSource: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'direct' : process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL ? 'proxy' : 'none',
    nodeEnv: process.env.NODE_ENV
  }

  // Multiple logging methods for production visibility
  console.log('🔧 Admin Supabase Environment Variables:', envDebugInfo)
  console.error('🔧 ADMIN_SUPABASE_DEBUG:', JSON.stringify(envDebugInfo, null, 2))
  console.warn('🔧 ADMIN_SUPABASE_CONFIG:', envDebugInfo)

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