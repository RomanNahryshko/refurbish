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
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { mockDevices, mockBatches } from '@/lib/mock-data'

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
  
  const itemsPerPage = 20
  
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

      {/* Compact Filters Toolbar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-2">
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
            <div className="flex items-center gap-2">
              <Select value={batchFilter} onValueChange={setBatchFilter}>
                <SelectTrigger id="batch" className="h-9 w-[140px]">
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
                <SelectTrigger id="brand" className="h-9 w-[140px]">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {uniqueBrands.map(brand => (
                    <SelectItem key={brand} value={brand!}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>


            </div>
            <div className="ml-auto flex items-center gap-2 w-full md:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setBatchFilter('all')
                  setBrandFilter('all')
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Devices Ready for QC ({filteredDevices.length} results)
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
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedDevices.length > 0 ? (
                  paginatedDevices.map((device) => {
                    const batch = mockBatches.find(b => b.id === device.batch_id)
                    
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
                          <Link href={`/qc/${device.internal_id}`}>
                            <Button size="sm" className="cursor-pointer">
                              <ClipboardCheck className="h-4 w-4" />
                              <span className="ml-2">Start QC</span>
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p>No devices awaiting final QC</p>
                    </td>
                  </tr>
                )}
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