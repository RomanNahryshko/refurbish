'use client'

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/loading-spinner';

import {
  ArrowLeft,
  Smartphone,
  Wrench,
  Hash
} from 'lucide-react';
import { useDeviceByInternalId, useDeviceStatusHistory } from '@/lib/hooks/use-devices';
import { statusConfig } from '@/components/common/device-list-table';
import { DeviceStatusHistoryTable } from '@/components/devices/device-status-history-table';
import { useUser } from '@/lib/hooks/use-user';
import { useProfile } from '@/lib/hooks/use-profile';



export default function DeviceJobSheetPage() {
  const params = useParams()
  const router = useRouter()
  const internalId = params.internalId as string
  
  // Get user and profile for role checking
  const { data: user } = useUser()
  const { data: profile } = useProfile(!!user)
  
  // Check if user is technician (L1 level)
  const isTechnician = profile?.role === 'technician'
  
  // Fetch device data by internal ID
  const { data: device, isLoading: deviceLoading, error: deviceError } = useDeviceByInternalId(internalId)
  
  // Fetch device status history
  const { data: statusHistory, isLoading: statusHistoryLoading, error: statusHistoryError, refetch: refetchStatusHistory, isFetching: statusHistoryFetching } = useDeviceStatusHistory(device?.id || '')
  
  // Refetch data every time the component mounts (page visit)
  useEffect(() => {
    if (device?.id) {
      refetchStatusHistory();
    }
  }, [device?.id, refetchStatusHistory]);
  

  
  // Validate internal ID format (8 digits)
  if (!/^\d{8}$/.test(internalId)) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Device ID</h1>
          <p className="text-gray-600 mt-2">Device ID must be 8 digits: {internalId}</p>
          <Link href="/devices" className="mt-4 inline-block">
            <Button>Back to Devices</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  // Show loading state
  if (deviceLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
          <span className="ml-2">Loading device information...</span>
        </div>
      </div>
    )
  }
  
  // Show error state
  if (deviceError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center">
            <div className="mx-auto h-10 w-10 text-red-600 mb-3 flex items-center justify-center">
              ⚠️
            </div>
            <h3 className="text-lg font-semibold text-red-600">Error Loading Device</h3>
            <p className="text-gray-600 mb-4">{deviceError.message}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Show not found state
  if (!device) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center">
            <div className="mx-auto h-10 w-10 text-gray-400 mb-3 flex items-center justify-center">
              ❓
            </div>
            <p className="text-gray-600">Device not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Extract batch data from device response
  const batch = device.batch

  const status = statusConfig[device.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  // Determine back link based on user role
  // Technicians can now access both devices and repair-jobs
  // Default to repair-jobs if profile is still loading (safer for technicians)
  const backLink = (!profile) ? '/repair-jobs' : '/devices'
  const backText = (!profile) ? 'Back to Repair Jobs' : 'Back to Devices'





  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={backLink}>
            <Button variant="ghost" size="sm" className="cursor-pointer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backText}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Smartphone className="h-6 w-6" />
              Device Job Sheet
            </h1>
            <p className="text-gray-600">Internal ID: {device.internal_id}</p>
          </div>
        </div>
        
        <div>
          <Link href="/repair-jobs">
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Wrench className="mr-2 h-4 w-4" />
              Repair Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Current Device Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg py-2 px-4">
              <StatusIcon className="mr-2 h-5 w-5" />
              {status.label}
            </Badge>
            <span className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Device Information Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Device Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Brand & Model</span>
                <p className="font-medium">{device.brand} {device.model}</p>
              </div>
              
              <div className="flex flex-col">
                <span className="text-gray-600">Color & Storage</span>
                {device?.color || device?.storage_capacity ? (
                  <p className="font-medium">{device.color} • {device.storage_capacity}</p>
                ) : (
                  <span className="text-gray-400">No color or storage capacity</span>
                )}
              </div>
              <div>
                <span className="text-gray-600">Grade</span>
                <div className="font-medium">
                  {device.dr_phone_data?.qc_data?.selected_grade && device.dr_phone_data.qc_data.selected_grade !== 'ungraded' ? (
                    <Badge variant="outline">Grade {device.dr_phone_data.qc_data.selected_grade}</Badge>
                  ) : device.grade && device.grade !== 'ungraded' ? (
                    <Badge variant="outline">Grade {device.grade}</Badge>
                  ) : (
                    <span className="text-gray-400">Not graded</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-600 flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Internal ID
                </span>
                <p className="font-mono font-medium">{device.internal_id}</p>
              </div>
              <div>
                <span className="text-gray-600">IMEI</span>
                <p className="font-mono text-xs">{device.imei || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Serial Number</span>
                <p className="font-mono text-xs">{device.serial_number || 'N/A'}</p>
              </div>
              {device.dr_phone_data?.required_repairs && device.dr_phone_data.required_repairs.length > 0 && (
                <div className="md:col-span-3">
                  <span className="text-gray-600">Required Repairs</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {device.dr_phone_data.required_repairs.map((repairId: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {repairId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                  {device.dr_phone_data.other_repair_description && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      &ldquo;{device.dr_phone_data.other_repair_description}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Batch & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-gray-600 text-sm">Batch</span>
              <div className="mt-1">
                <Link href={`/batch-intake/${batch?.id}`}>
                  <Badge variant="outline" className="cursor-pointer">
                    {batch?.batch_number || 'N/A'}
                  </Badge>
                </Link>
              </div>
            </div>
            {batch?.supplier?.name && (
              <div>
                <span className="text-gray-600 text-sm">Supplier</span>
                <p className="text-sm font-medium">{batch.supplier.name}</p>
              </div>
            )}
            <div>
              <span className="text-gray-600 text-sm">Received Date</span>
              <p className="text-sm">{batch?.received_date ? new Date(batch.received_date).toLocaleDateString() : new Date(device.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Status History */}
      {statusHistoryFetching && (
        <div className="flex items-center justify-center py-2 text-sm text-gray-500">
          <LoadingSpinner size="sm" />
          <span className="ml-2">Updating status history...</span>
        </div>
      )}
      <DeviceStatusHistoryTable
        deviceId={device.id}
        statusHistory={statusHistory || []}
        isLoading={statusHistoryLoading}
        error={statusHistoryError}
      />


    </div>
  );
}