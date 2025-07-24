// Supabase environment configuration
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
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