'use client'

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { mockDevices, mockBatches } from '@/lib/mock-data';
import { DeviceListTable } from '@/components/common/device-list-table';
import { DEVICE_STATUS_LABELS, DEFAULT_ITEMS_PER_PAGE } from '@/lib/constants';



export default function DeviceTrackingPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [batchFilter, setBatchFilter] = useState<string>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE

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
          <h1 className="text-3xl font-bold">Device Tracking</h1>
          <p className="text-gray-600 mt-1">Search devices by IMEI or Internal ID to view job sheets</p>
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
                  {Object.entries(DEVICE_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
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
          <DeviceListTable
            devices={paginatedDevices}
            batches={mockBatches}
            columns={['internal_id', 'device', 'imei', 'batch', 'status', 'grade', 'actions']}
            renderActions={(device) => (
              <Link href={`/device-tracking/${device.internal_id}`}>
                <Button size="sm" className="cursor-pointer">
                  <Eye className="h-4 w-4" />
                  <span className="ml-2">View</span>
                </Button>
              </Link>
            )}
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={filteredDevices.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}