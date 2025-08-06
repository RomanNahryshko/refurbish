'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Search,
  Smartphone,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  ClipboardCheck
} from 'lucide-react'
import Link from 'next/link'
import { mockBatches, mockDevices, mockRepairJobs, mockQCChecks } from '@/lib/mock-data'

export default function BatchDevicesPage() {
  const params = useParams()
  const batchId = params.id as string
  const batch = mockBatches.find(b => b.id === batchId)
  const batchDevices = mockDevices.filter(d => d.batch_id === batchId)
  
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredDevices = batchDevices.filter(device =>
    device.imei.includes(searchTerm) ||
    device.internal_id.includes(searchTerm) ||
    device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <Package className="h-4 w-4" />
      case 'initial_qc':
      case 'final_qc':
        return <ClipboardCheck className="h-4 w-4" />
      case 'awaiting_repair':
      case 'in_repair':
        return <Wrench className="h-4 w-4" />
      case 'graded':
      case 'ready_to_ship':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'secondary'
      case 'initial_qc':
      case 'final_qc':
        return 'default'
      case 'awaiting_repair':
        return 'destructive'
      case 'in_repair':
        return 'warning'
      case 'graded':
      case 'ready_to_ship':
        return 'success'
      default:
        return 'outline'
    }
  }

  const getDeviceStats = () => {
    const stats = {
      expected: batch.device_count, // Expected count from batch creation
      received: batchDevices.length, // Actual devices imported/in DB
      inQC: 0,
      inRepair: 0,
      readyToShip: 0
    }
    
    batchDevices.forEach(device => {
      if (device.status.includes('qc')) stats.inQC++
      else if (device.status.includes('repair')) stats.inRepair++
      else if (['graded', 'ready_to_ship', 'shipped'].includes(device.status)) stats.readyToShip++
    })
    
    return stats
  }

  const stats = getDeviceStats()

  if (!batch) {
    return <div>Batch not found</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/batch-intake" className="cursor-pointer">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Batch Devices</h1>
          <p className="text-muted-foreground">
            {batch.batch_number} • Received {new Date(batch.received_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/batch-intake/${batchId}/import`} className="cursor-pointer">
            <Button variant="outline">Import Dr. Phone</Button>
          </Link>
          <Link href={`/batch-intake/${batchId}/labels`} className="cursor-pointer">
            <Button variant="outline">Generate Labels</Button>
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.expected}</div>
            <p className="text-sm text-muted-foreground">Expected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.received}</div>
            <p className="text-sm text-muted-foreground">Imported from Dr Phone</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.inQC}</div>
            <p className="text-sm text-muted-foreground">In QC</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.inRepair}</div>
            <p className="text-sm text-muted-foreground">In Repair</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.readyToShip}</div>
            <p className="text-sm text-muted-foreground">Ready to Ship</p>
          </CardContent>
        </Card>
      </div>

      {/* Device List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Device List</CardTitle>
              <CardDescription>
                All devices in this batch with their current status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by IMEI, Internal ID, Model, or Status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Device Table - Compact View */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 text-left">Internal ID</th>
                  <th className="p-3 text-left">Device</th>
                  <th className="p-3 text-left">IMEI</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Grade</th>
                  <th className="p-3 text-left">QC</th>
                  <th className="p-3 text-left">Repairs</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device, index) => {
                  const repairs = mockRepairJobs.filter(r => r.device_id === device.id)
                  const qcChecks = mockQCChecks.filter(q => q.device_id === device.id)
                  const hasInitialQC = qcChecks.some(q => q.check_type === 'initial')
                  const hasFinalQC = qcChecks.some(q => q.check_type === 'final')
                  const pendingRepairs = repairs.filter(r => r.status === 'pending').length
                  const completedRepairs = repairs.filter(r => r.status === 'completed').length
                  
                  return (
                    <tr 
                      key={device.id}
                      className={`border-b hover:bg-muted/50 transition-colors ${
                        index % 2 === 0 ? '' : 'bg-muted/20'
                      }`}
                    >
                      <td className="p-3">
                        <Link 
                          href={`/job-sheet/${device.internal_id}`}
                          className="font-mono font-semibold hover:underline cursor-pointer text-primary"
                        >
                          {device.internal_id}
                        </Link>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{device.brand} {device.model}</div>
                          {device.storage_capacity && (
                            <div className="text-xs text-muted-foreground">{device.storage_capacity}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-sm">{device.imei}</span>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant={getStatusColor(device.status) as any}
                          className="gap-1 text-xs"
                        >
                          {getStatusIcon(device.status)}
                          {device.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {device.grade !== 'ungraded' ? (
                          <Badge variant="outline" className="font-bold">
                            {device.grade}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {hasInitialQC && (
                            <Badge variant="secondary" className="text-xs">
                              Initial
                            </Badge>
                          )}
                          {hasFinalQC && (
                            <Badge variant="secondary" className="text-xs">
                              Final
                            </Badge>
                          )}
                          {!hasInitialQC && !hasFinalQC && (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {repairs.length > 0 ? (
                          <div className="text-sm">
                            <span className="font-medium">{completedRepairs}/{repairs.length}</span>
                            {pendingRepairs > 0 && (
                              <span className="text-muted-foreground ml-1">
                                ({pendingRepairs} pending)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Link href={`/job-sheet/${device.internal_id}`} className="cursor-pointer">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            View Details →
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredDevices.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No devices found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}