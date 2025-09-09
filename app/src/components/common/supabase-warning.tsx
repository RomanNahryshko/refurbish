'use client'

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { hasValidSupabaseConfig } from '@/lib/supabase'

export function SupabaseWarning() {
  if (hasValidSupabaseConfig) {
    return null
  }

  return (
    <Alert className="mb-4 border-warning bg-warning/10">
      <AlertCircle className="h-4 w-4 text-warning" />
      <AlertTitle>Supabase Configuration Required</AlertTitle>
      <AlertDescription className="mt-2">
        <p>Authentication features are currently disabled. To enable them:</p>
        <ol className="mt-2 list-decimal ml-6 space-y-1">
          <li>Create a free Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
          <li>Copy your project URL and anon key from the Supabase dashboard</li>
          <li>Update your <code className="bg-muted px-1 py-0.5 rounded text-sm">.env.local</code> file with:</li>
        </ol>
        <pre className="mt-2 bg-muted p-3 rounded text-sm">
{`NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
        <p className="mt-2 text-sm text-muted-foreground">
          After updating, restart your development server.
        </p>
      </AlertDescription>
    </Alert>
  )
} 