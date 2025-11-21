'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Eye,
  Calendar,
  FileText,
  DollarSign,
  Package,
  ArrowLeft
} from 'lucide-react';
import { useBatches } from '@/lib/hooks/use-batches';
import { DeviceListTable } from '@/components/common/device-list-table';
import { DEVICE_STATUS_LABELS, DEFAULT_ITEMS_PER_PAGE, DEVICE_STATUS, DEVICE_GRADES } from '@/lib/constants';
import { useBatch } from '@/lib/hooks/use-batches';
import { useDevices, useDevicesByBatch } from '@/lib/hooks/use-devices';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { Device } from '@/lib/types/business-types';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import dayjs from 'dayjs';

function DevicesPageContent() {
  const searchParams = useSearchParams();
  const batchFromUrl = searchParams.get('batch');
  const fromReport = searchParams.get('fromReport') === 'true';
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const brand = searchParams.get('brand');
  const model = searchParams.get('model');
  const batchId = searchParams.get('batchId');
  const technicianIds = searchParams.getAll('technicianId');
  const repairTypes = searchParams.getAll('repairType');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>(batchFromUrl || 'all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [qcApproachFilter, setQcApproachFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Fetch batch data if batch parameter is present
  const { data: batchData, isLoading: batchLoading, error: batchError, refetch: refetchBatch, isFetching: batchFetching } = useBatch(batchFromUrl || '');
  
  // Fetch devices from batch if batch parameter is present
  const { data: batchDevices, isLoading: devicesLoading, error: devicesError, refetch: refetchBatchDevices, isFetching: devicesFetching } = useDevicesByBatch(batchFromUrl || '');
  
  // Fetch all devices if no batch parameter is present
  const { data: allDevicesData, isPending: allDevicesLoading, error: allDevicesError, refetch: refetchAllDevices } = useDevices();
  
  // Fetch devices for report view (devices that passed Final QC in date range)
  const { data: reportDevicesData, isPending: reportDevicesLoading, error: reportDevicesError } = useQuery({
    queryKey: ['devices-from-report', fromReport, dateFrom, dateTo, brand, model, batchId, technicianIds, repairTypes],
    queryFn: async () => {
      if (!fromReport || !dateFrom || !dateTo) return null
      try {
        const params = new URLSearchParams()
        params.set('dateFrom', dateFrom)
        params.set('dateTo', dateTo)
        if (brand) params.set('brand', brand)
        if (model) params.set('model', model)
        if (batchId) params.set('batchId', batchId)
        if (technicianIds.length > 0) {
          params.set('technicianIds', technicianIds.join(','))
        }
        if (repairTypes.length > 0) {
          params.set('repairTypes', repairTypes.join(','))
        }
        
        const response = await fetch(`/api/devices/final-qc?${params.toString()}`, {
          credentials: 'include'
        })
        if (!response.ok) {
          console.error('Failed to fetch devices from report:', response.status, response.statusText)
          return null
        }
        const result = await response.json()
        return result.data || []
      } catch (error) {
        console.error('Error fetching devices from report:', error)
        return null
      }
    },
    enabled: fromReport && !!dateFrom && !!dateTo
  })
  
  // Fetch all batches for filter options
  const { data: batches } = useBatches();
  
  // Update batch filter when URL changes
  useEffect(() => {
    if (batchFromUrl) {
      setBatchFilter(batchFromUrl);
    }
  }, [batchFromUrl]);

  // Refetch data every time the component mounts (page visit)
  useEffect(() => {
    if (batchFromUrl) {
      refetchBatch();
      refetchBatchDevices();
    } else {
      refetchAllDevices();
    }
  }, [batchFromUrl, refetchBatch, refetchBatchDevices, refetchAllDevices]);
  
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  // Use report devices when fromReport=true, otherwise use normal devices
  const allDevices = fromReport && reportDevicesData
    ? reportDevicesData.map((device: any) => ({
        id: device.id,
        internal_id: device.internal_id,
        imei: device.imei,
        brand: device.brand,
        model: device.model,
        color: device.color,
        storage_capacity: device.storage_capacity,
        status: device.status,
        grade: device.grade || 'ungraded'
      }))
    : batchFromUrl && batchDevices 
    ? batchDevices.map((device: Device) => ({
        ...device,
        status: device.status,
        grade: device.grade || 'ungraded'
      }))
    : (allDevicesData || []).map((device: Device) => ({
        ...device,
        status: device.status,
        grade: device.grade || 'ungraded'
      }));

  // Filter devices based on search and filters
  const filteredDevices = allDevices.filter((device: Device) => {
    const matchesSearch = 
      device.internal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.model?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    const matchesBatch = batchFilter === 'all' || device.batch_id === batchFilter;
    const matchesBrand = brandFilter === 'all' || device.brand === brandFilter;
    const matchesGrade = gradeFilter === 'all' || device.grade === gradeFilter;
    
    // Filter by QC approach (repairs vs grade)
    const matchesQcApproach = qcApproachFilter === 'all' || 
      (qcApproachFilter === 'repairs' && device.dr_phone_data?.required_repairs && device.dr_phone_data.required_repairs.length > 0) ||
      (qcApproachFilter === 'grade' && device.dr_phone_data?.grade && device.dr_phone_data.grade !== 'ungraded');

    return matchesSearch && matchesStatus && matchesBatch && matchesBrand && matchesGrade && matchesQcApproach;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);

  // Get unique values for filters
  const uniqueBrands = [...new Set(allDevices.map((d: Device) => d.brand))];
  const uniqueGrades = [...new Set(allDevices.map((d: Device) => d.grade).filter(Boolean))];

  // KPI counts - use filtered devices to reflect current filter state
  const totalCount = filteredDevices.length;
  const readyCount = filteredDevices.filter((d: Device) => d.status === DEVICE_STATUS.graded).length;
  
  // Additional KPI counts for QC data
  const repairsRequiredCount = filteredDevices.filter((d: Device) => d.dr_phone_data?.required_repairs && d.dr_phone_data.required_repairs.length > 0 && d.status !== DEVICE_STATUS.graded).length;
  const gradeAssignedCount = filteredDevices.filter((d: Device) => d?.grade && d.grade !== DEVICE_GRADES.ungraded).length;

  // Loading state for devices
  const isLoading = fromReport 
    ? reportDevicesLoading 
    : batchFromUrl 
    ? (batchLoading || devicesLoading) 
    : allDevicesLoading;
  const hasError = fromReport 
    ? reportDevicesError 
    : batchFromUrl 
    ? (batchError || devicesError) 
    : allDevicesError;
  
  // Check if any data is being refetched (for showing loading state)
  const isRefetching = fromReport 
    ? reportDevicesLoading 
    : batchFromUrl 
    ? (batchFetching || devicesFetching) 
    : allDevicesLoading;

  // Show loading state (like on batch-intake page)
  if (isLoading || isRefetching) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Devices</h1>
            <p className="text-muted-foreground">Loading devices...</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (hasError) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Devices</h1>
            <p className="text-muted-foreground">Error loading devices</p>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-600">Error loading devices: {String(hasError) || 'Unknown error'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render report view with simplified table
  if (fromReport) {
    const totalResults = filteredDevices.length
    const totalPages = Math.ceil(totalResults / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedDevices = filteredDevices.slice(startIndex, endIndex)

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/reports/device-refurbishing">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Report
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Repaired Devices</h1>
              <p className="text-gray-600">
                {dateFrom && dateTo && `Date Range: ${dayjs(dateFrom).format('DD MMM YYYY')} - ${dayjs(dateTo).format('DD MMM YYYY')}`}
              </p>
            </div>
          </div>
        </div>

        {/* Devices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Devices Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Storage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No devices found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDevices.map((device: Device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-mono text-sm">{device.imei || '-'}</TableCell>
                      <TableCell>{device.model || 'Unknown'}</TableCell>
                      <TableCell>{device.color || '-'}</TableCell>
                      <TableCell>{device.storage_capacity || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalResults)} of {totalResults} devices
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Devices
            {batchFromUrl && batchData && (
              <span className="text-xl text-gray-500 ml-2">
                - Batch {batchData.batch_number}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            {batchFromUrl 
              ? batchData 
                ? `Showing devices from batch ${batchData.batch_number}`
                : 'Loading batch information...'
              : allDevicesData 
                ? `Showing all ${allDevicesData.length} devices in the system`
                : 'Loading all devices...'
            }
          </p>
        </div>

        {/* Inline KPIs — Option A: Badge row (visual only) */}
        <div className="w-full md:w-auto mt-4 md:mt-0 md:ml-6 flex flex-wrap items-center gap-2">
          <div className="h-8 rounded-sm border border-gray-300 px-3 flex items-center gap-2 text-gray-800 select-none">
            <span className="font-semibold">{totalCount}</span>
            <span className="text-sm">Total</span>
          </div>
          <div className="h-8 rounded-sm border border-green-300 px-3 flex items-center gap-2 text-green-700 select-none">
            <span className="font-semibold">{readyCount}</span>
            <span className="text-sm">Ready</span>
          </div>
          <div className="h-8 rounded-sm border border-red-300 px-3 flex items-center gap-2 text-red-700 select-none">
            <span className="font-semibold">{repairsRequiredCount}</span>
            <span className="text-sm">Repairs</span>
          </div>
          <div className="h-8 rounded-sm border border-blue-300 px-3 flex items-center gap-2 text-blue-700 select-none">
            <span className="font-semibold">{gradeAssignedCount}</span>
            <span className="text-sm">Graded</span>
          </div>
        </div>
      </div>

      {/* Batch Information Card - Show when batch parameter is present */}
      {batchFromUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Batch Information
            </CardTitle>
            <CardDescription>
              Details for batch {batchData?.batch_number || batchFromUrl}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {batchLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2">Loading batch information...</span>
              </div>
            ) : batchError ? (
              <div className="text-red-600 py-4">
                Error loading batch information: {batchError.message}
              </div>
            ) : batchData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Batch Number</p>
                      <p className="font-semibold">{batchData.batch_number}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Received Date</p>
                      <p className="font-semibold">
                        {new Date(batchData.received_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Invoice</p>
                      <p className="font-semibold">
                        {batchData.invoice_number || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold">
                        {batchData.invoice_amount 
                          ? `$${batchData.invoice_amount.toLocaleString()}`
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                {batchData.supplier_name && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Supplier</p>
                    <p className="text-blue-800 font-semibold">{batchData.supplier_name}</p>
                  </div>
                )}
                
                {batchData.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-600 font-medium">Notes</p>
                    <p className="text-yellow-800">{batchData.notes}</p>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Device List with Integrated Filters */}
      <Card>
        <CardContent>
          {isRefetching && (
            <div className="flex items-center justify-center py-2 text-sm text-gray-500">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Updating devices...</span>
            </div>
          )}
          <DeviceListTable
                devices={paginatedDevices}
                batches={batches || []}
                columns={['internal_id', 'device', 'imei', 'batch', 'status', 'grade', 'required_repairs', 'actions']}
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
                        {(batches || []).map((batch: { id: string; batch_number: string }) => (
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
                          <SelectItem key={brand as string} value={brand as string}>{brand as string}</SelectItem>
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
                        <SelectItem key={grade as string} value={grade as string}>{grade as string}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={qcApproachFilter} onValueChange={setQcApproachFilter}>
                    <SelectTrigger className="h-9 w-[130px]">
                      <SelectValue placeholder="All QC Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All QC Types</SelectItem>
                      <SelectItem value="repairs">Repairs Required</SelectItem>
                      <SelectItem value="grade">Grade Assigned</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setBatchFilter('all');
                      setBrandFilter('all');
                      setGradeFilter('all');
                      setQcApproachFilter('all');
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
  );
}

export default function DevicesPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="md" />}>
      <DevicesPageContent />
    </Suspense>
  );
}