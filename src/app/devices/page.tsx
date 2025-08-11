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
  Eye
} from 'lucide-react'
import { mockDevices, mockBatches } from '@/lib/mock-data'
import { DeviceListTable } from '@/components/common/device-list-table'
import { DEVICE_STATUS_LABELS, DEFAULT_ITEMS_PER_PAGE } from '@/lib/constants'



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

  // KPI counts (used across variants)
  const totalCount = mockDevices.length
  const repairCount = mockDevices.filter(d => d.status === 'in_repair').length
  const qcCount = mockDevices.filter(d => d.status === 'initial_qc' || d.status === 'final_qc').length
  const readyCount = mockDevices.filter(d => d.status === 'ready_to_ship').length

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
        {/* Inline KPIs — Option A: Badge row (visual only) */}
        <div className="w-full md:w-auto mt-4 md:mt-0 md:ml-6 flex flex-wrap items-center gap-2">
          <div className="h-8 rounded-sm border border-gray-300 px-3 flex items-center gap-2 text-gray-800 select-none">
            <span className="font-semibold">{totalCount}</span>
            <span className="text-sm">Total</span>
          </div>
          <div className="h-8 rounded-sm border border-orange-300 px-3 flex items-center gap-2 text-orange-700 select-none">
            <span className="font-semibold">{repairCount}</span>
            <span className="text-sm">Repair</span>
          </div>
          <div className="h-8 rounded-sm border border-purple-300 px-3 flex items-center gap-2 text-purple-700 select-none">
            <span className="font-semibold">{qcCount}</span>
            <span className="text-sm">QC</span>
          </div>
          <div className="h-8 rounded-sm border border-green-300 px-3 flex items-center gap-2 text-green-700 select-none">
            <span className="font-semibold">{readyCount}</span>
            <span className="text-sm">Ready</span>
          </div>
        </div>
      </div>

      {/* (Removed preview variants) */}



      {/* Device List with Integrated Filters */}
      <Card>
        <CardContent>
          <DeviceListTable
            devices={paginatedDevices}
            batches={mockBatches}
            columns={['internal_id', 'device', 'imei', 'batch', 'status', 'grade', 'actions']}
            renderActions={(device) => (
              <Link href={`/devices/${device.internal_id}`}>
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
            title="Devices"
            pageKey="devices"
            renderFilters={() => (
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    placeholder="Search IMEI / Internal ID"
                    aria-label="Search IMEI or Internal ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-8"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-[140px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.entries(DEVICE_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={batchFilter} onValueChange={setBatchFilter}>
                    <SelectTrigger className="h-9 w-[120px]">
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

                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger className="h-9 w-[110px]">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {uniqueBrands.filter(Boolean).map(brand => (
                        <SelectItem key={brand} value={brand!}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="h-9 w-[110px]">
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

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                      setBatchFilter('all')
                      setBrandFilter('all')
                      setGradeFilter('all')
                    }}
                    className="h-9"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}