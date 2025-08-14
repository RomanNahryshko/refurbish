'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ClipboardCheck,
  Search
} from 'lucide-react'
import { mockDevices, mockBatches } from '@/lib/mock-data'
import { DeviceListTable } from '@/components/common/device-list-table'
import { DEFAULT_ITEMS_PER_PAGE } from '@/lib/constants'

// Filter devices that need final QC
const devicesForQC = mockDevices.filter(d => d.status === 'final_qc')

// QC-specific data calculations (MVP scope)
const getQCMetrics = () => {
  return {
    inQueue: mockDevices.filter(d => d.status === 'final_qc').length
  }
}

export default function QualityControlPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [batchFilter, setBatchFilter] = useState<string>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')

  const [currentPage, setCurrentPage] = useState(1)
  
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE
  
  // Get QC metrics
  const qcMetrics = getQCMetrics()
  
  // Get unique values for filters
  const uniqueBrands = [...new Set(devicesForQC.map(d => d.brand).filter(Boolean))]
  
  // Filter devices based on search and filters
  const filteredDevices = devicesForQC.filter(device => {
    const matchesSearch = 
      device.internal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.model?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    const matchesBatch = batchFilter === 'all' || device.batch_id === batchFilter
    const matchesBrand = brandFilter === 'all' || device.brand === brandFilter
    
    return matchesSearch && matchesBatch && matchesBrand
  })

  // Pagination
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with KPI badges */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Final Quality Control</h1>
          <p className="text-gray-600 mt-1">Devices ready for final QC after repairs</p>
        </div>
        {/* Inline KPI — QC queue count only (MVP scope) */}
        <div className="w-full md:w-auto mt-4 md:mt-0 md:ml-6 flex flex-wrap items-center gap-2">
          <div className="h-8 rounded-sm border border-purple-300 px-3 flex items-center gap-2 text-purple-700 select-none">
            <span className="font-semibold">{qcMetrics.inQueue}</span>
            <span className="text-sm">In Queue</span>
          </div>
        </div>
      </div>



      {/* Device Table with Integrated Filters */}
      <Card>
        <CardContent>
          <DeviceListTable
            devices={paginatedDevices}
            batches={mockBatches}
            columns={['internal_id', 'device', 'imei', 'batch', 'actions']}
            renderActions={(device) => (
              <Link href={`/qc/${device.internal_id}`}>
                <Button size="sm" className="cursor-pointer">
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="ml-2">Start QC</span>
                </Button>
              </Link>
            )}
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={filteredDevices.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            title="Devices Ready for QC"
            pageKey="qc"
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
                      {uniqueBrands.map(brand => (
                        <SelectItem key={brand} value={brand!}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setBatchFilter('all')
                      setBrandFilter('all')
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