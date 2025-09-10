'use client';

import { useSupabaseStore } from '@/lib/stores/supabase-store';
import { hasValidSupabaseConfig } from '@/lib/supabase';

export function DebugInfo() {
  const { client, isReady, user } = useSupabaseStore();
  
  // Only show in development or when there are issues
  if (process.env.NODE_ENV === 'production' && hasValidSupabaseConfig) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🐛 Debug Info</h3>
      <div className="space-y-1">
        <div>Environment: {process.env.NODE_ENV}</div>
        <div>Supabase Config: {hasValidSupabaseConfig ? '✅ Valid' : '❌ Invalid'}</div>
        <div>Client Ready: {isReady ? '✅ Yes' : '❌ No'}</div>
        <div>Client Created: {client ? '✅ Yes' : '❌ No'}</div>
        <div>User: {user ? `✅ ${user.email}` : '❌ None'}</div>
        <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
        <div>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
      </div>
    </div>
  );
}
