// Supabase environment configuration
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Debug logging for production troubleshooting
if (typeof window !== 'undefined') {
  console.log('🔧 Supabase Config Debug:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING',
    urlLength: supabaseUrl.length,
    anonKeyLength: supabaseAnonKey.length
  })
}

// Validate Supabase URL format
const isValidSupabaseUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    const isValid = parsed.protocol === 'https:' && url.includes('supabase.co')
    
    if (typeof window !== 'undefined') {
      console.log('🔧 URL Validation:', {
        url: url ? `${url.substring(0, 30)}...` : 'MISSING',
        protocol: parsed.protocol,
        hasSupabaseCo: url.includes('supabase.co'),
        isValid
      })
    }
    
    return isValid
  } catch (error) {
    if (typeof window !== 'undefined') {
      console.log('🔧 URL Validation Error:', error)
    }
    return false
  }
}

// Check if we have valid Supabase configuration
export const hasValidSupabaseConfig = 
  isValidSupabaseUrl(supabaseUrl) && 
  supabaseAnonKey.length > 0 &&
  !supabaseUrl.includes('your-project-ref')

if (typeof window !== 'undefined') {
  console.log('🔧 Supabase Config Status:', {
    hasValidSupabaseConfig,
    urlValid: isValidSupabaseUrl(supabaseUrl),
    anonKeyPresent: supabaseAnonKey.length > 0,
    notPlaceholder: !supabaseUrl.includes('your-project-ref')
  })
}

if (!hasValidSupabaseConfig) {
  // Supabase configuration is missing or invalid
  if (typeof window !== 'undefined') {
    console.error('❌ Supabase configuration is invalid or missing')
  }
}

// Type for Supabase client options
export type SupabaseOptions = {
  db?: {
    schema?: string
  }
  auth?: {
    persistSession?: boolean
    storageKey?: string
    storage?: unknown
    flowType?: 'implicit' | 'pkce'
    autoRefreshToken?: boolean
    detectSessionInUrl?: boolean
  }
  global?: {
    headers?: Record<string, string>
  }
} 