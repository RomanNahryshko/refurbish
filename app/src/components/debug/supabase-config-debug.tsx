'use client'

import { supabaseUrl, supabaseAnonKey, hasValidSupabaseConfig } from '@/lib/supabase'

export function SupabaseConfigDebug() {
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">🔧 Supabase Config Debug</h3>
      <div className="space-y-1">
        <div>
          <strong>URL:</strong> {supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING'}
        </div>
        <div>
          <strong>Anon Key:</strong> {supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING'}
        </div>
        <div>
          <strong>URL Length:</strong> {supabaseUrl.length}
        </div>
        <div>
          <strong>Anon Key Length:</strong> {supabaseAnonKey.length}
        </div>
        <div>
          <strong>Valid Config:</strong> {hasValidSupabaseConfig ? '✅' : '❌'}
        </div>
        <div>
          <strong>Environment:</strong> {process.env.NODE_ENV}
              </div>
              <div>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL}
              </div>
              <div>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
              </div>
              <div> {process.env.SUPABASE_SERVICE_ROLE_KEY} </div>
      </div>
    </div>
  )
}
