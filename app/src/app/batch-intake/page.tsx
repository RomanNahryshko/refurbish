'use client'

import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { Plus, Search, Download, FileText, Package, Edit } from 'lucide-react';
import { useBatches } from '@/lib/hooks/use-batches';
import { useDeviceCountByBatch } from '@/lib/hooks/use-devices';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { Batch } from '@/lib/types/business-types';

// Component to display device count for a specific batch
function BatchDeviceCount({ batchId }: { batchId: string }) {
  const { data: deviceCount, isLoading } = useDeviceCountByBatch(batchId)
  
  if (isLoading) {
    return <Badge variant="outline">...</Badge>
  }
  
  return (
    <Badge variant="outline">
      {deviceCount || 0}
    </Badge>
  )
}

export default function BatchIntakePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300) // 300ms delay
  const { data: batches, isPending: isLoading, error, refetch, isFetching } = useBatches()
  
  // Refetch data every time the component mounts (page visit)
  useEffect(() => {
    refetch()
  }, [refetch])
  
  const filteredBatches = useMemo(() => {
    return batches?.filter((batch: Batch) =>
      batch.batch_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      batch.invoice_number?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ) || []
  }, [batches, debouncedSearchTerm])

  const headerList = [
    { label: 'Batch Number', key: 'batch_number' },
    { label: 'Supplier', key: 'supplier_name' },
    { label: 'Expected', key: 'device_count' },
    { label: 'Total Devices', key: 'completed_qc_count' },
    { label: 'Invoice', key: 'invoice_number' },
    { label: 'Date', key: 'received_date' },
    { label: 'Amount', key: 'invoice_amount' },
    { label: 'Actions', key: 'actions' }
  ]

  // Show loading state
  if (isLoading || isFetching) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Batch Intake</h1>
            <p className="text-muted-foreground">Manage incoming phone batches and imports</p>
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
  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Batch Intake</h1>
            <p className="text-muted-foreground">Manage incoming phone batches and imports</p>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-600">Error loading batches: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Batch Intake</h1>
            <p className="text-muted-foreground">Manage incoming phone batches and imports</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
            >
              Refresh
            </Button>
            <Link href="/batch-intake/create" className="cursor-pointer">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Batch
              </Button>
            </Link>
          </div>
        </div>

      {/* Batch List - Compact Table View */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  {headerList.map((header) => (
                    <th key={header.key} className="p-3 text-left font-medium">
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch: Batch, index) => {
                  const expectedCount = batch.device_count
                  return (
                    <tr 
                      key={batch.id} 
                      className={`border-b hover:bg-muted/50 transition-colors cursor-pointer ${
                        index % 2 === 0 ? '' : 'bg-muted/20'
                      }`}
                    >
                      <td className="p-3">
                        <Link href={`/devices?batch=${batch.id}`} className="hover:underline font-medium cursor-pointer text-primary">
                          {batch.batch_number}
                        </Link>
                      </td>
                      <td className="p-3 text-sm">Unknown</td>
                      <td className="p-3">
                        <Badge variant="outline">{expectedCount}</Badge>
                      </td>
                      <td className="p-3">
                        <BatchDeviceCount batchId={batch.id} />
                      </td>
                      <td className="p-3 text-sm font-mono">{batch.invoice_number || '-'}</td>
                      <td className="p-3 text-sm">
                        {batch.received_date 
                          ? new Date(batch.received_date).toLocaleDateString() 
                          : '-'}
                      </td>
                      <td className="p-3 text-sm font-medium">
                        {batch.invoice_amount 
                          ? `$${batch.invoice_amount.toLocaleString()}` 
                          : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 flex-wrap">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/batch-intake/${batch.id}/edit`} className="cursor-pointer">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Batch</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/batch-intake/${batch.id}/import`} className="cursor-pointer">
                                <Button variant="outline" size="sm">
                                  <Download className="h-3 w-3" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Import Devices</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/devices?batch=${batch.id}`} className="cursor-pointer">
                                <Button variant="outline" size="sm">
                                  <Package className="h-3 w-3" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Devices</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/batch-intake/${batch.id}/labels`} className="cursor-pointer">
                                <Button variant="outline" size="sm">
                                  <FileText className="h-3 w-3" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Generate Labels</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredBatches.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No batches found</p>
          </CardContent>
        </Card>
      )}
        </div>
      </TooltipProvider>
    )
  }