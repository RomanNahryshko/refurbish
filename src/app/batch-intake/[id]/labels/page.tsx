'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Printer, Search, FileText } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useBatch } from '@/lib/hooks/use-batches'
import { devicesApi } from '@/lib/api/devices'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useLabelPrinter } from '@/lib/hooks/use-label-printer'
import { Device } from '@/lib/types/business-types'

export default function LabelGenerationPage() {
  const params = useParams()
  const batchId = params.id as string
  const { data: batch, isLoading: batchLoading, error: batchError } = useBatch(batchId)

  const [searchTerm, setSearchTerm] = useState('')
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(false)

  const { printLabel, printAllLabels } = useLabelPrinter(devices, batch)

  useEffect(() => {
    if (batchId) {
      setIsLoadingDevices(true)
      devicesApi.getByBatchId(batchId)
        .then((data) => setDevices(data))
        .catch(() => toast.error('Failed to load devices'))
        .finally(() => setIsLoadingDevices(false))
    }
  }, [batchId])

  const filteredDevices = devices.filter((device: Device) =>
    device.imei.includes(searchTerm) ||
    device.internal_id.includes(searchTerm) ||
    device.model?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (batchLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (batchError || !batch) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading batch: {batchError?.message || 'Batch not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/batch-intake" className="cursor-pointer">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Label Generation</h1>
          <p className="text-muted-foreground">Batch: {batch.batch_number}</p>
        </div>
      </div>

      {/* Label Preview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Label Preview</CardTitle>
          <CardDescription>This is how the label will appear when printed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-6 bg-white max-w-md mx-auto">
            <div className="space-y-2 font-mono text-sm">
              <div className="text-center font-bold text-lg mb-3">REMOBILE REFURBISH</div>
              <div className="border-t pt-2">
                <strong>ID:</strong> {devices.length > 0 ? devices[0].internal_id : '00000001'}
              </div>
              <div><strong>IMEI:</strong> {devices.length > 0 ? devices[0].imei : '123456789012345'}</div>
              <div><strong>Model:</strong> {devices.length > 0 ? `${devices[0].brand || ''} ${devices[0].model || ''}`.trim() || 'iPhone 12' : 'iPhone 12'}</div>
              <div><strong>S/N:</strong> {devices.length > 0 ? devices[0].serial_number || 'N/A' : 'SN123456'}</div>
              <div className="border-t mb-[-10px] pt-3 text-center text-xs">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Device Label Printing</CardTitle>
              <CardDescription>Print labels one at a time for each device</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{devices.length} devices</Badge>
              {devices.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={printAllLabels}
                  disabled={isLoadingDevices}
                >
                  <Printer className="h-3 w-3 mr-1" /> Print All Labels
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by IMEI, Internal ID, or Model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Device Table */}
          {isLoadingDevices ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="border rounded-lg">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">Internal ID</th>
                    <th className="p-3 text-left">IMEI</th>
                    <th className="p-3 text-left">Model</th>
                    <th className="p-3 text-left">Serial Number</th>
                    <th className="p-3 text-left">Print Label</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((device, index) => (
                    <tr
                      key={device.id}
                      className={`border-b hover:bg-muted/50 transition-colors ${index % 2 === 0 ? '' : 'bg-muted/20'}`}
                    >
                      <td className="p-3 font-mono font-semibold">{device.internal_id}</td>
                      <td className="p-3 font-mono text-sm">{device.imei}</td>
                      <td className="p-3">{device.brand} {device.model}</td>
                      <td className="p-3 font-mono text-sm">{device.serial_number || 'N/A'}</td>
                      <td className="p-3">
                        <Button size="sm" onClick={() => printLabel(device.id)}>
                          <Printer className="h-3 w-3 mr-1" /> Print Label
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredDevices.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No devices found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Printer Settings Info */}
      <Alert className="mt-6">
        <FileText className="h-4 w-4" />
        <AlertDescription>Ensure printer is connected and has sufficient label stock.</AlertDescription>
      </Alert>
    </div>
  )
}
