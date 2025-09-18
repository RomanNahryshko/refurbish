// Supabase environment configuration
// Use proxy URL if available, otherwise fallback to direct Supabase URL
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''


// Validate Supabase URL format (supports both direct Supabase and proxy URLs)
const isValidSupabaseUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    // Allow both https (direct Supabase) and http (local proxy)
    const isValidProtocol = parsed.protocol === 'https:' || parsed.protocol === 'http:'
    const isValidDomain = url.includes('supabase.co') || url.includes('localhost') || url.includes('127.0.0.1') || url.includes('backend-proxy.attractgroup.com')
    const isValid = isValidProtocol && isValidDomain
    
    
    return isValid
  } catch {
    return false
  }
}

// Check if we have valid Supabase configuration
export const hasValidSupabaseConfig = 
  isValidSupabaseUrl(supabaseUrl) && 
  supabaseAnonKey.length > 0 &&
  !supabaseUrl.includes('your-project-ref')

// Debug Supabase environment variables
console.log('🔧 Supabase Environment Variables:', {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'MISSING',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'MISSING',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'MISSING',
  NEXT_PUBLIC_SUPABASE_PROXY_URL: process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL.substring(0, 30)}...` : 'MISSING',
  selectedUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
  hasValidConfig: hasValidSupabaseConfig,
  isClient: typeof window !== 'undefined'
})



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