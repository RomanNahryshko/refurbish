'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'

interface FixResult {
  device_id: string
  imei: string
  brand?: string
  model?: string
  status: string
  repair_jobs_completed?: number
  repair_types?: string[]
  error?: string
}

interface FixResponse {
  message: string
  summary: {
    total_devices_checked: number
    affected_devices: number
    fixed_devices: number
    dry_run: boolean
    timestamp: string
  }
  affected_devices: any[]
  results: FixResult[]
}

export default function FixDeviceStatusPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FixResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const runFix = async (dryRun: boolean = true) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/devices/fix-completed-repairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dry_run: dryRun }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to run fix script')
      }

      const data = await response.json()
      setResult(data)
      
      toast.success({
        title: dryRun ? 'Dry Run Completed' : 'Fix Completed',
        description: data.message,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fix Device Status</h1>
          <p className="text-muted-foreground">
            Fix devices stuck in &apos;in_repair&apos; status when all repair jobs are completed
          </p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This script will find devices in &apos;in_repair&apos; status where all repair jobs are completed
          and update their status to &apos;final_qc&apos;. Always run a dry run first to preview changes.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Run Status Fix Script</CardTitle>
          <CardDescription>
            Choose to run in dry-run mode (preview only) or execute the actual fix
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={() => runFix(true)}
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Info className="mr-2 h-4 w-4" />}
              Dry Run (Preview)
            </Button>
            
            <Button
              onClick={() => runFix(false)}
              disabled={loading || !result?.summary?.affected_devices}
              variant="default"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Execute Fix
            </Button>
          </div>

          {result && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Run a dry run first to see which devices will be affected before executing the actual fix.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Results
              <Badge variant={result.summary?.dry_run ? "secondary" : "default"}>
                {result.summary?.dry_run ? "Dry Run" : "Executed"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {result.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{result?.summary?.total_devices_checked}</div>
                <div className="text-sm text-muted-foreground">Devices Checked</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{result?.summary?.affected_devices}</div>
                <div className="text-sm text-muted-foreground">Need Fixing</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result?.summary?.fixed_devices}</div>
                <div className="text-sm text-muted-foreground">Fixed</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xs font-mono">{new Date(result?.summary?.timestamp).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Timestamp</div>
              </div>
            </div>

            {result.results && result.results.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Affected Devices:</h4>
                <div className="space-y-2">
                  {result?.results.map((device, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {device.brand} {device.model} ({device.imei})
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Device ID: {device.device_id}
                          </div>
                          {device.repair_jobs_completed && (
                            <div className="text-sm text-muted-foreground">
                              Completed repairs: {device.repair_jobs_completed}
                            </div>
                          )}
                          {device.repair_types && (
                            <div className="text-sm text-muted-foreground">
                              Types: {device.repair_types.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge 
                            variant={
                              device.status === 'fixed' ? 'default' : 
                              device.status === 'would_be_fixed' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {device.status === 'fixed' ? 'Fixed' : 
                             device.status === 'would_be_fixed' ? 'Will Fix' : 
                             'Error'}
                          </Badge>
                          {device.error && (
                            <div className="text-xs text-red-600">{device.error}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
