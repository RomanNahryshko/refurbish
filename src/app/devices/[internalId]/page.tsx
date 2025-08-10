'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { 
  ArrowLeft,
  Smartphone,
  Package,
  Wrench,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Hash,
  ClipboardCheck,
  Package2
} from 'lucide-react'
import { mockDevices, mockBatches, mockRepairJobs, mockQCChecks, mockUsers, getDeviceByInternalId } from '@/lib/mock-data'
import { statusConfig } from '@/components/common/device-list-table'

export default function DeviceJobSheetPage() {
  const params = useParams()
  const router = useRouter()
  const internalId = params.internalId as string
  
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
  
  const device = getDeviceByInternalId(internalId)
  const batch = device ? mockBatches.find(b => b.id === device.batch_id) : null
  const repairs = device ? mockRepairJobs.filter(r => r.device_id === device.id) : []
  const qcChecks = device ? mockQCChecks.filter(q => q.device_id === device.id) : []
  


  if (!device) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-gray-600">Device not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusConfig[device.status as keyof typeof statusConfig]
  const StatusIcon = status.icon



  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/devices">
            <Button variant="ghost" size="sm" className="cursor-pointer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Devices
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Device Details</TabsTrigger>
          <TabsTrigger value="qc">Quality Control</TabsTrigger>
          <TabsTrigger value="repairs">Repairs</TabsTrigger>
        </TabsList>

        {/* Device Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Brand</span>
                  <span className="font-medium">{device.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Model</span>
                  <span className="font-medium">{device.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Color</span>
                  <span className="font-medium">{device.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage</span>
                  <span className="font-medium">{device.storage_capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Grade</span>
                  <span className="font-medium">
                    {device.grade && device.grade !== 'ungraded' ? (
                      <Badge>Grade {device.grade}</Badge>
                    ) : (
                      <span className="text-gray-400">Not graded yet</span>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identifiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    Internal ID
                  </span>
                  <span className="font-mono font-medium">{device.internal_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IMEI</span>
                  <span className="font-mono text-sm">{device.imei || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Serial Number</span>
                  <span className="font-mono text-sm">{device.serial_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Batch</span>
                  <Link href={`/batch-intake/${batch?.id}`}>
                    <Badge variant="outline" className="cursor-pointer">
                      {batch?.batch_number || 'N/A'}
                    </Badge>
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Received Date</span>
                  <span className="text-sm">{new Date(device.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quality Control Tab */}
        <TabsContent value="qc" className="space-y-4">
          {qcChecks.length > 0 ? (
            qcChecks.map((qc) => {
              const qcTech = mockUsers.find(u => u.id === qc.performed_by)
              return (
                <Card key={qc.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {qc.check_type === 'initial' ? 'Initial QC' : 'Final QC'}
                        </CardTitle>
                        <CardDescription>
                          Performed by {qcTech?.full_name} on {new Date(qc.performed_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant={qc.overall_result === 'pass' ? 'default' : 'destructive'}>
                        {qc.overall_result === 'pass' ? 'Passed' : 'Failed'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {qc.test_results?.map((test, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {test.result === 'pass' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm capitalize">
                            {test.test_name.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                    {qc.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm">{qc.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <ClipboardCheck className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <p className="text-gray-600">No QC checks performed yet</p>
                <Button className="mt-4">
                  Start Initial QC
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Repairs Tab */}
        <TabsContent value="repairs" className="space-y-4">
          {repairs.length > 0 ? (
            repairs.map((repair) => {
              const technician = mockUsers.find(u => u.id === repair.assigned_to)
              return (
                <Card key={repair.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {repair.repair_type.split('_').map(w => 
                            w.charAt(0).toUpperCase() + w.slice(1)
                          ).join(' ')} Repair
                        </CardTitle>
                        <CardDescription>
                          Assigned to {technician?.full_name}
                        </CardDescription>
                      </div>
                      <Badge variant={
                        repair.status === 'completed' ? 'default' :
                        repair.status === 'in_progress' ? 'secondary' :
                        'outline'
                      }>
                        {repair.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Created</span>
                        <span>{new Date(repair.created_at).toLocaleDateString()}</span>
                      </div>
                      {repair.parts_used && repair.parts_used.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium mb-1">Parts Used:</p>
                          <ul className="text-sm text-gray-600">
                            {repair.parts_used.map((part, idx) => (
                              <li key={idx}>• {part.part_name} (Qty: {part.quantity_used})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {repair.completion_notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-sm">{repair.completion_notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <Wrench className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <p className="text-gray-600">No repairs assigned yet</p>
                <Button className="mt-4">
                  Create Repair Task
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>


      </Tabs>
    </div>
  )
}