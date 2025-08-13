'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  ArrowLeft,
  Smartphone,
  Wrench,
  CheckCircle,
  XCircle,
  Hash,
  ClipboardCheck,
} from 'lucide-react';
import { mockBatches, mockRepairJobs, mockQCChecks, mockUsers, getDeviceByInternalId } from '@/lib/mock-data';
import { statusConfig } from '@/components/common/device-list-table';

export default function DeviceJobSheetPage() {
  const params = useParams()
  const internalId = params.internalId as string
  
  const device = getDeviceByInternalId(internalId)
  
  if (!device) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Device Not Found</h1>
          <p className="text-gray-600 mt-2">No device found with internal ID: {internalId}</p>
          <Link href="/device-tracking" className="mt-4 inline-block">
            <Button>Back to Device Tracking</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  const batch = mockBatches.find(b => b.id === device.batch_id)
  const repairs = mockRepairJobs.filter(r => r.device_id === device.id)
  const qcChecks = mockQCChecks.filter(q => q.device_id === device.id)
  


  const status = statusConfig[device.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  const deviceInfoFields = [
    { label: "Brand", value: device.brand },
    { label: "Model", value: device.model },
    { label: "Color", value: device.color },
    { label: "Storage", value: device.storage_capacity },
    { 
      label: "Grade", 
      value: device.grade && device.grade !== 'ungraded' ? (
        <Badge>Grade {device.grade}</Badge>
      ) : (
        <span className="text-gray-400">Not graded yet</span>
      )
    },
  ];

  const identifierFields = [
    { 
      label: "Internal ID", 
      value: device.internal_id,
      icon: <Hash className="h-4 w-4" />,
      className: "font-mono font-medium"
    },
    { 
      label: "IMEI", 
      value: device.imei || 'N/A',
      className: "font-mono text-sm"
    },
    { 
      label: "Serial Number", 
      value: device.serial_number || 'N/A',
      className: "font-mono text-sm"
    },
    { 
      label: "Batch", 
      value: (
        <Link href={`/batch-intake/${batch?.id}`}>
          <Badge variant="outline" className="cursor-pointer">
            {batch?.batch_number || 'N/A'}
          </Badge>
        </Link>
      )
    },
    { 
      label: "Received Date", 
      value: new Date(device.created_at).toLocaleDateString(),
      className: "text-sm"
    },
  ];


  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/device-tracking">
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
                {deviceInfoFields.map((field, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{field.label}</span>
                    <span className="font-medium">{field.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identifiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {identifierFields.map((field, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      {field.icon}
                      {field.label}
                    </span>
                    <span className={field.className}>{field.value}</span>
                  </div>
                ))}
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