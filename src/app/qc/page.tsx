'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ClipboardCheck,
  Search
} from 'lucide-react'
import { DeviceListTable } from '@/components/common/device-list-table'
import { DEFAULT_ITEMS_PER_PAGE } from '@/lib/constants'
import { useDevicesForFinalQC } from '@/lib/hooks/use-devices'
import { useQCChecks } from '@/lib/hooks/use-devices'
import { useBatches } from '@/lib/hooks/use-batches'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mockDevices, mockBatches, mockQCChecks } from '@/lib/mock-data'

export default function QCPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [batchFilter, setBatchFilter] = useState<string>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE
  const queryClient = useQueryClient()
  
  // Fetch devices that are ready for final QC
  const { data: devicesForQC, isLoading: devicesLoading, error: devicesError } = useDevicesForFinalQC()
  
  // Fetch batches for device information
  const { data: batches, isLoading: batchesLoading, error: batchesError } = useBatches()
  
  // Fetch QC checks for history - only when we have devices
  const { data: qcChecks, error: qcChecksError } = useQCChecks(
    devicesForQC && devicesForQC.length > 0 ? devicesForQC.map(d => d.id) : undefined,
    { enabled: !!(devicesForQC && devicesForQC.length > 0) }
  )
  
  // Fallback to mock data if database is not available
  const fallbackDevices = mockDevices.filter(d => d.status === 'final_qc')
  const fallbackBatches = mockBatches
  const fallbackQCChecks = mockQCChecks.filter(qc => qc.check_type === 'final')
  
  // Use real data if available, otherwise fallback to mock data
  const finalDevices = devicesError ? fallbackDevices : (devicesForQC || [])
  const finalBatches = batchesError ? fallbackBatches : (batches || [])
  const finalQCChecks = qcChecksError ? fallbackQCChecks : (qcChecks || [])
  
  // Refetch data every time the component mounts (page visit)
  useEffect(() => {
    // Force refetch when component mounts to get fresh data
    const refetchData = async () => {
      // This will ensure we get the latest data every time user visits the page
      setIsRefreshing(true)
      
      try {
        // Only try to refetch if we have a valid database connection
        if (!devicesError && !batchesError) {
          // Force refetch of devices and batches data
          await queryClient.refetchQueries({ queryKey: ['devices', 'final-qc'] })
          await queryClient.refetchQueries({ queryKey: ['batches'] })
          
          // If we have devices, also refetch QC checks
          const devicesData = queryClient.getQueryData(['devices', 'final-qc'])
          if (devicesData && Array.isArray(devicesData) && devicesData.length > 0) {
            const deviceIds = devicesData.map((d: { id: string }) => d.id)
            await queryClient.refetchQueries({ queryKey: ['qc-checks', deviceIds] })
          }
        }
      } finally {
        setIsRefreshing(false)
      }
    }
    refetchData()
  }, [queryClient, devicesError, batchesError]) // Include errors in dependencies
  
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
  const transformedDevices = finalDevices?.map(device => ({
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
          <p className="text-gray-600 mt-1">Devices ready for final QC after repairs</p>
          <div className="mt-8 p-8 bg-gray-50 rounded-lg">
            <p className="text-lg text-gray-500">No devices are currently ready for final QC.</p>
            <p className="text-sm text-gray-400 mt-2">
              Devices will appear here once they complete the repair process and are marked as ready for final QC.
            </p>
            {(devicesError || batchesError) && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ Using mock data - Database connection not available. 
                  <br />
                  Set up Supabase configuration to use real data.
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
    // Only calculate metrics if we have QC checks data
    if (!finalQCChecks) {
      return {
        inQueue: transformedDevices.length,
        completedToday: 0,
        totalCompleted: 0
      }
    }
    
    const devicesWithQC = finalQCChecks.filter((qc: { check_type: string }) => qc.check_type === 'final') || []
    const completedQC = devicesWithQC.filter((qc: { overall_result: string }) => qc.overall_result === 'pass' || qc.overall_result === 'fail')
    
    return {
      inQueue: transformedDevices.length,
      completedToday: completedQC.filter((qc: { performed_at?: string; created_at: string }) => {
        const today = new Date().toDateString()
        return new Date(qc.performed_at || qc.created_at).toDateString() === today
      }).length,
      totalCompleted: completedQC.length
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
            {isRefreshing && (
              <span className="ml-2 inline-flex items-center gap-1 text-blue-600 text-lg font-normal">
                <LoadingSpinner className="h-4 w-4" />
                Updating...
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            Devices ready for final QC after repairs
          </p>
          {(devicesError || batchesError) && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              ⚠️ Using mock data - Database connection not available
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            disabled={isRefreshing || !!(devicesError && batchesError)}
            onClick={async () => {
              try {
                setIsRefreshing(true)
                if (!devicesError && !batchesError) {
                  await queryClient.refetchQueries({ queryKey: ['devices', 'final-qc'] })
                  await queryClient.refetchQueries({ queryKey: ['batches'] })
                  if (devicesForQC && devicesForQC.length > 0) {
                    const deviceIds = devicesForQC.map(d => d.id)
                    await queryClient.refetchQueries({ queryKey: ['qc-checks', deviceIds] })
                  }
                  toast.success('Data refreshed successfully!')
                } else {
                  toast.info('Using mock data - no database connection available')
                }
              } catch {
                toast.error('Failed to refresh data')
              } finally {
                setIsRefreshing(false)
              }
            }}
            className="flex items-center gap-2"
          >
            {isRefreshing ? (
              <>
                <LoadingSpinner className="h-4 w-4" />
                Refreshing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          
          {/* KPI badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`h-8 rounded-sm border px-3 flex items-center gap-2 select-none ${
              isRefreshing 
                ? 'border-gray-300 text-gray-500' 
                : 'border-purple-300 text-purple-700'
            }`}>
              <span className="font-semibold">
                {isRefreshing ? <LoadingSpinner className="h-3 w-3" /> : qcMetrics.inQueue}
              </span>
              <span className="text-sm">In Queue</span>
            </div>
            <div className={`h-8 rounded-sm border px-3 flex items-center gap-2 select-none ${
              isRefreshing 
                ? 'border-gray-300 text-gray-500' 
                : 'border-green-300 text-green-700'
            }`}>
              <span className="font-semibold">
                {isRefreshing ? <LoadingSpinner className="h-3 w-3" /> : qcMetrics.completedToday}
              </span>
              <span className="text-sm">Today</span>
            </div>
            <div className={`h-8 rounded-sm border px-3 flex items-center gap-2 select-none ${
              isRefreshing 
                ? 'border-gray-300 text-gray-500' 
                : 'border-blue-300 text-blue-700'
            }`}>
              <span className="font-semibold">
                {isRefreshing ? <LoadingSpinner className="h-3 w-3" /> : qcMetrics.totalCompleted}
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
            batches={finalBatches || []}
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
                      {(finalBatches || []).map((batch: { id: string; batch_number: string }) => (
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