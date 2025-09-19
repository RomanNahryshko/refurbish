'use client';;
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ClipboardCheck,
  Search
} from 'lucide-react';
import { DeviceListTable } from '@/components/common/device-list-table';
import { DEFAULT_ITEMS_PER_PAGE, DEVICE_STATUS } from '@/lib/constants';
import { Batch, Device } from '@/lib/types/business-types';
import { useDevicesForFinalQC, useDevices } from '@/lib/hooks/use-devices';
import { useBatches } from '@/lib/hooks/use-batches';
import { LoadingSpinner } from '@/components/common/loading-spinner';

export default function QCPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [batchFilter, setBatchFilter] = useState<string>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE
  
  // Fetch devices that are ready for final QC
  const { data: devicesForQC, isLoading: devicesLoading, error: devicesError, refetch: refetchDevicesForQC } = useDevicesForFinalQC()
  
  // Fetch batches for device information
  const { batches, loading: batchesLoading, error: batchesError, fetchBatches: refetchBatches } = useBatches()
  
  // Fetch all devices for metrics calculation
  const { devices: allDevices, fetchDevices: refetchAllDevices } = useDevices()
  
  // Refetch data every time the component mounts (page visit)
  useEffect(() => { 
    // Force refetch when component mounts to get fresh data
    const refetchData = async () => {
      setIsRefreshing(true)
      
      try {
        // Force refetch of devices and batches data
        refetchDevicesForQC()
        refetchBatches()
        refetchAllDevices()
      } finally {
        setIsRefreshing(false)
      }
    }
    refetchData()
  }, [refetchDevicesForQC, refetchBatches, refetchAllDevices])
  
  // Show loading state while data is being fetched or refreshing
  if ((devicesLoading || batchesLoading) && !devicesError && !batchesError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    )
  }
  
  // Transform API data to match DeviceListTable expectations
  // Since we're not getting batch info in joins anymore, we need to handle it differently
  const transformedDevices = devicesForQC?.map(device => ({
    ...device,
    // Ensure batch_id is available for DeviceListTable batch lookup
    batch_id: device.batch_id || ''
  })) || []
  
  // Check if there are any devices for QC
  if (transformedDevices.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Final Quality Control</h1>
          <p className="text-gray-600 mt-1">Devices ready for final QC after repairs!</p>
          <div className="mt-8 p-8 bg-gray-50 rounded-lg">
            <p className="text-lg text-gray-500">No devices are currently ready for final QC.</p>
            <p className="text-sm text-gray-400 mt-2">
              Devices will appear here once they complete the repair process and are marked as ready for final QC.
            </p>
            {(devicesError || batchesError) && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800 font-semibold">
                  ❌ Database connection error. Please check your connection and try again.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // QC-specific data calculations (MVP scope)
  const getQCMetrics = () => {
    // Calculate inQueue from current devices
    const inQueue = transformedDevices.length
    
    // Calculate completedToday from devices that moved to graded today
    let completedToday = 0
    let totalCompleted = 0
    
    if (allDevices && Array.isArray(allDevices)) {
      const today = new Date().toDateString()
      
      // Count devices that moved to graded today
      completedToday = allDevices.filter((device: Device) => {
        if (device.status === DEVICE_STATUS.graded && device.updated_at) {
          const updatedDate = new Date(device.updated_at).toDateString()
          const isToday = updatedDate === today
          
          
          
          return isToday
        }
        return false
      }).length
      
      // Count total devices with graded status
      totalCompleted = allDevices.filter((device: Device) => device.status === DEVICE_STATUS.graded).length
    }
    
    return {
      inQueue,
      completedToday,
      totalCompleted
    }
  }
  
  // Get QC metrics
  const qcMetrics = getQCMetrics()
  
  // Get unique values for filters
  const uniqueBrands = [...new Set(transformedDevices.map(d => d.brand).filter(Boolean))]
  
  // Filter devices based on search and filters
  const filteredDevices = transformedDevices.filter(device => {
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Final Quality Control
          </h1>
          <p className="text-gray-600 mt-1">
            Devices ready for final QC after repairs
          </p>

        </div>
        
        <div className="flex items-center gap-4">
          
          {/* KPI badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`h-8 rounded-sm border px-3 flex items-center gap-2 select-none ${
              isRefreshing 
                ? 'border-gray-300 text-gray-500' 
                : 'border-purple-300 text-purple-700'
            }`}>
              <span className="font-semibold">
                {qcMetrics.inQueue}
              </span>
              <span className="text-sm">In Queue</span>
            </div>
            <div className={`h-8 rounded-sm border px-3 flex items-center gap-2 select-none ${
              isRefreshing 
                ? 'border-gray-300 text-gray-500' 
                : 'border-green-300 text-green-700'
            }`}>
              <span className="font-semibold">
                {qcMetrics.completedToday}
              </span>
              <span className="text-sm">Today</span>
            </div>
            <div className={`h-8 rounded-sm border px-3 flex items-center gap-2 select-none ${
              isRefreshing 
                ? 'border-gray-300 text-gray-500' 
                : 'border-blue-300 text-blue-700'
            }`}>
              <span className="font-semibold">
                {qcMetrics.totalCompleted}
              </span>
              <span className="text-sm">Total</span>
            </div>
          </div>
        </div>
      </div>

      
      {/* Device Table with Integrated Filters */}
      <Card>
        <CardContent>
          <DeviceListTable
            devices={paginatedDevices}
            batches={batches || []}
            columns={['internal_id', 'device', 'imei', 'batch', 'actions']}
            renderActions={(device) => (
              <Link href={`/qc/${device.internal_id}`}>
                <Button size="sm" className="cursor-pointer" disabled={isRefreshing}>
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="ml-2">
                    {isRefreshing ? 'Updating...' : 'Start QC'}
                  </span>
                </Button>
              </Link>
            )}
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={filteredDevices.length}
            itemsPerPage={itemsPerPage}
            onPageChange={isRefreshing ? () => {} : setCurrentPage}
            title={`Devices Ready for QC${isRefreshing ? ' (Updating...)' : ''}`}
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
                    disabled={isRefreshing}
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={batchFilter} onValueChange={setBatchFilter} disabled={isRefreshing}>
                    <SelectTrigger className="h-9 w-[120px]">
                      <SelectValue placeholder="All Batches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Batches</SelectItem>
                      {(batches || []).map((batch: Batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batch_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={brandFilter} onValueChange={setBrandFilter} disabled={isRefreshing}>
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
                    disabled={isRefreshing}
                  >
                    Clear
                  </Button>
                  
                  {isRefreshing && (
                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                      <LoadingSpinner className="h-3 w-3" />
                      Updating filters...
                    </div>
                  )}
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}