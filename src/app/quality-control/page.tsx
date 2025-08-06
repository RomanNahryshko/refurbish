'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  ClipboardCheck,
  Search,
  Smartphone,
  ArrowRight,
  Package
} from 'lucide-react'
import { mockDevices, mockBatches } from '@/lib/mock-data'

// Filter devices that need final QC
const devicesForQC = mockDevices.filter(d => d.status === 'final_qc')

// Add more mock devices for final QC
const additionalQCDevices = [
  {
    id: 'device-10',
    internal_id: '00000010',
    batch_id: 'batch-2',
    imei: '223456789012349',
    serial_number: 'SN223460',
    brand: 'Apple',
    model: 'iPhone 13 Pro',
    color: 'Sierra Blue',
    storage_capacity: '256GB',
    status: 'final_qc',
    grade: 'ungraded',
    created_at: '2024-01-17T09:00:00Z'
  },
  {
    id: 'device-11',
    internal_id: '00000011',
    batch_id: 'batch-1',
    imei: '223456789012350',
    serial_number: 'SN223461',
    brand: 'Samsung',
    model: 'Galaxy S22 Ultra',
    color: 'Phantom Black',
    storage_capacity: '512GB',
    status: 'final_qc',
    grade: 'ungraded',
    created_at: '2024-01-17T10:00:00Z'
  },
  {
    id: 'device-12',
    internal_id: '00000012',
    batch_id: 'batch-2',
    imei: '223456789012351',
    serial_number: 'SN223462',
    brand: 'Google',
    model: 'Pixel 7 Pro',
    color: 'Snow',
    storage_capacity: '128GB',
    status: 'final_qc',
    grade: 'ungraded',
    created_at: '2024-01-17T11:00:00Z'
  }
]

// Combine mock data
const allDevicesForQC = [...devicesForQC, ...additionalQCDevices]

export default function QualityControlPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [batchFilter, setBatchFilter] = useState<string>('all')
  
  // Filter devices based on search and filters
  const filteredDevices = allDevicesForQC.filter(device => {
    const matchesSearch = 
      device.internal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.model?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    const matchesBatch = batchFilter === 'all' || device.batch_id === batchFilter
    
    return matchesSearch && matchesBatch
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Final Quality Control</h1>
        <p className="text-gray-600 mt-1">Devices ready for final QC after repairs</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search Device</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Internal ID or IMEI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="batch">Filter by Batch</Label>
              <Select value={batchFilter} onValueChange={setBatchFilter}>
                <SelectTrigger id="batch">
                  <SelectValue placeholder="All Batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {mockBatches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batch_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices Awaiting QC */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <ClipboardCheck className="mr-2 h-5 w-5" />
            Devices Ready for QC ({filteredDevices.length})
          </CardTitle>
          <CardDescription>
            Select a device to perform final quality control and grade assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredDevices.length > 0 ? (
              filteredDevices.map((device) => {
                const batch = mockBatches.find(b => b.id === device.batch_id)
                
                return (
                  <Card key={device.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Smartphone className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-lg">{device.internal_id}</span>
                            {device.grade === 'ungraded' && (
                              <Badge variant="outline">Ungraded</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {device.brand} {device.model} • {device.color} • {device.storage_capacity}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              Batch: {batch?.batch_number}
                            </span>
                            <span>IMEI: {device.imei}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/quality-control/${device.id}`}>
                        <Button>
                          Start QC
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>No devices awaiting final QC</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}