// Supabase environment configuration
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validate Supabase URL format
const isValidSupabaseUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && url.includes('supabase.co')
  } catch {
    return false
  }
}

// Check if we have valid Supabase configuration
export const hasValidSupabaseConfig = 
  isValidSupabaseUrl(supabaseUrl) && 
  supabaseAnonKey.length > 0 &&
  !supabaseUrl.includes('your-project-ref')

if (!hasValidSupabaseConfig) {
  console.error('❌ Supabase Config: Invalid configuration detected')
  console.error('❌ Supabase Config: URL:', supabaseUrl)
  console.error('❌ Supabase Config: URL valid:', isValidSupabaseUrl(supabaseUrl))
  console.error('❌ Supabase Config: Key length:', supabaseAnonKey.length)
  console.error('❌ Supabase Config: Contains placeholder:', supabaseUrl.includes('your-project-ref'))
} else {
  console.log('✅ Supabase Config: Configuration is valid')
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