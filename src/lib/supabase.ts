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
  console.warn(
    '⚠️  Supabase configuration is missing or invalid. Authentication features will not work.\n' +
    'Please set up a Supabase project and update your .env.local file with:\n' +
    '- NEXT_PUBLIC_SUPABASE_URL\n' +
    '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

// Type for Supabase client options
export type SupabaseOptions = {
  db?: {
    schema?: string
  }
  auth?: {
    persistSession?: boolean
    storageKey?: string
    storage?: any
    flowType?: 'implicit' | 'pkce'
    autoRefreshToken?: boolean
    detectSessionInUrl?: boolean
  }
  global?: {
    headers?: Record<string, string>
  }
} 