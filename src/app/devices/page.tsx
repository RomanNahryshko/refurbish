'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  Filter, 
  Smartphone,
  AlertCircle,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Wrench,
  Package,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileSearch
} from 'lucide-react'
import { mockDevices, mockBatches } from '@/lib/mock-data'

// Device status to icon/color mapping
const statusConfig = {
  'received': { icon: Package, color: 'bg-gray-500', label: 'Received' },
  'initial_qc': { icon: ClipboardCheck, color: 'bg-blue-500', label: 'Initial QC' },
  'awaiting_repair': { icon: Clock, color: 'bg-yellow-500', label: 'Awaiting Repair' },
  'in_repair': { icon: Wrench, color: 'bg-orange-500', label: 'In Repair' },
  'final_qc': { icon: CheckCircle, color: 'bg-purple-500', label: 'Final QC' },
  'graded': { icon: CheckCircle, color: 'bg-green-500', label: 'Graded' },
  'ready_to_ship': { icon: Package, color: 'bg-indigo-500', label: 'Ready to Ship' },
  'shipped': { icon: CheckCircle, color: 'bg-green-600', label: 'Shipped' },
  'failed': { icon: XCircle, color: 'bg-red-500', label: 'Failed' },
  'returned': { icon: AlertCircle, color: 'bg-red-600', label: 'Returned' }
}

export default function DevicesPage() {
  const searchParams = useSearchParams()
  const batchFromUrl = searchParams.get('batch')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [batchFilter, setBatchFilter] = useState<string>(batchFromUrl || 'all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Update batch filter when URL changes
  useEffect(() => {
    if (batchFromUrl) {
      setBatchFilter(batchFromUrl)
    }
  }, [batchFromUrl])
  const itemsPerPage = 10

  // Filter devices based on search and filters
  const filteredDevices = mockDevices.filter(device => {
    const matchesSearch = 
      device.internal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.model?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter
    const matchesBatch = batchFilter === 'all' || device.batch_id === batchFilter
    const matchesBrand = brandFilter === 'all' || device.brand === brandFilter
    const matchesGrade = gradeFilter === 'all' || device.grade === gradeFilter

    return matchesSearch && matchesStatus && matchesBatch && matchesBrand && matchesGrade
  })

  // Pagination
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage)

  // Get unique values for filters
  const uniqueBrands = [...new Set(mockDevices.map(d => d.brand))]
  const uniqueGrades = [...new Set(mockDevices.map(d => d.grade).filter(Boolean))]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Devices
            {batchFromUrl && (
              <span className="text-xl text-gray-500 ml-2">
                - Batch {mockBatches.find(b => b.id === batchFromUrl)?.batch_number || batchFromUrl}
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            {batchFromUrl 
              ? `Showing devices from batch ${mockBatches.find(b => b.id === batchFromUrl)?.batch_number || batchFromUrl}`
              : 'Search devices by IMEI or Internal ID to view job sheets'
            }
          </p>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDevices.length}</div>
            <p className="text-xs text-gray-600">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Repair</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {mockDevices.filter(d => d.status === 'in_repair').length}
            </div>
            <p className="text-xs text-gray-600">Currently being repaired</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Awaiting QC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {mockDevices.filter(d => d.status === 'initial_qc' || d.status === 'final_qc').length}
            </div>
            <p className="text-xs text-gray-600">Quality control needed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ready to Ship</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockDevices.filter(d => d.status === 'ready_to_ship').length}
            </div>
            <p className="text-xs text-gray-600">Completed & graded</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-1">
              <Label htmlFor="search">Search by IMEI or Internal ID</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Enter IMEI or Internal ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="batch">Batch</Label>
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
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger id="brand">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {uniqueBrands.filter(Boolean).map(brand => (
                    <SelectItem key={brand} value={brand!}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger id="grade">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="ungraded">Ungraded</SelectItem>
                  {uniqueGrades.filter(g => g !== 'ungraded').map(grade => (
                    <SelectItem key={grade} value={grade!}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Devices ({filteredDevices.length} results)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Internal ID</th>
                  <th className="pb-2 font-medium">Device</th>
                  <th className="pb-2 font-medium">IMEI</th>
                  <th className="pb-2 font-medium">Batch</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Grade</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedDevices.map((device) => {
                  const batch = mockBatches.find(b => b.id === device.batch_id)
                  const status = statusConfig[device.status as keyof typeof statusConfig]
                  const StatusIcon = status.icon
                  
                  return (
                    <tr key={device.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center">
                          <Smartphone className="mr-2 h-4 w-4 text-gray-400" />
                          <span className="font-mono font-medium">{device.internal_id}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{device.brand} {device.model}</div>
                          <div className="text-sm text-gray-600">
                            {device.color} • {device.storage_capacity}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-mono text-sm">{device.imei || '-'}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm">{batch?.batch_number || '-'}</span>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {device.grade && device.grade !== 'ungraded' ? (
                          <Badge variant="default">Grade {device.grade}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3">
                        <Link href={`/devices/${device.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                            <span className="ml-2">View</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDevices.length)} of {filteredDevices.length} devices
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}