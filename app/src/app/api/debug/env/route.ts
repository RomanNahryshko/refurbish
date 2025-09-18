import { NextResponse } from 'next/server'

export async function GET() {
  const selectedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || ''
  const debugInfo = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'MISSING',
    NEXT_PUBLIC_SUPABASE_PROXY_URL: process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL.substring(0, 30)}...` : 'MISSING',
    selectedUrl: selectedUrl ? `${selectedUrl.substring(0, 30)}...` : 'MISSING',
    urlSource: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'direct' : process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL ? 'proxy' : 'none',
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }

  // Log to console for Docker logs
  console.log('🔧 API Debug Environment Variables:', debugInfo)
  console.error('🔧 API_SUPABASE_DEBUG:', JSON.stringify(debugInfo, null, 2))
  console.warn('🔧 API_SUPABASE_CONFIG:', debugInfo)

  return NextResponse.json({
    success: true,
    debug: debugInfo,
    message: 'Environment variables logged to console'
  })
}
