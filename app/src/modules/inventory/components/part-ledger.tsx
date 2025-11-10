'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DateRange } from 'react-day-picker'
import { Card, CardContent} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DateRangePicker } from '@/components/dashboard/date-range-picker'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { LedgerData, LedgerFilters } from '@/lib/types/business-types'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import Link from 'next/link'
import dayjs from 'dayjs'
import { useBatches } from '@/lib/hooks/use-batches'
import { useUsers } from '@/lib/hooks/use-users'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PartLedgerProps {
  partId: string
}

export function PartLedger({ partId }: PartLedgerProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [technicianId, setTechnicianId] = useState<string>('all')
  const [transactionType, setTransactionType] = useState<string>('all')
  const [batchId, setBatchId] = useState<string>('all')

  // Fetch batches for filter
  const { data: batches } = useBatches()
  
  // Fetch technicians for filter
  const { data: technicians } = useUsers({ role: 'technician' })

  // Build filters object
  // Format dates with time to include full day range (start of day to end of day)
  const filters: LedgerFilters = {
    start_date: dateRange?.from 
      ? dayjs(dateRange.from).startOf('day').toISOString()
      : undefined,
    end_date: dateRange?.to 
      ? dayjs(dateRange.to).endOf('day').toISOString()
      : undefined,
    technician_id: technicianId && technicianId !== 'all' ? technicianId : undefined,
    transaction_type: transactionType && transactionType !== 'all' ? transactionType as LedgerFilters['transaction_type'] : undefined,
    batch_id: batchId && batchId !== 'all' ? batchId : undefined,
  }

  // Fetch ledger data
  const { data: ledgerData, isLoading, error } = useQuery<LedgerData>({
    queryKey: ['part-ledger', partId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.technician_id) params.append('technician_id', filters.technician_id)
      if (filters.transaction_type) params.append('transaction_type', filters.transaction_type)
      if (filters.batch_id) params.append('batch_id', filters.batch_id)

      const response = await fetch(`/api/inventory/parts/${partId}/ledger?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch ledger data')
      }

      return response.json()
    },
    staleTime: 0, // Always consider data stale to ensure fresh requests
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })

  const handleExportPDF = () => {
    if (!ledgerData || !part) return

    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(18)
    doc.text('Item Ledger', 14, 20)
    doc.setFontSize(12)
    doc.text(`${part.name} (${part.sku})`, 14, 28)
    doc.text(period_label, 14, 34)
    
    if (opening_balance !== undefined && dateRange?.from && dateRange?.to) {
      doc.text(`Opening Balance: ${opening_balance}`, 14, 40)
    }

    // Prepare table data
    const tableData = entries.map((entry) => [
      dayjs(entry.date_time).format('YYYY-MM-DD HH:mm'),
      entry.ref,
      entry.technician_name || '-',
      entry.device_internal_id || '-',
      entry.device_brand && entry.device_model
        ? `${entry.device_brand} ${entry.device_model} ${entry.device_storage || ''} ${entry.device_color || ''}`.trim()
        : '-',
      entry.transaction_type === 'correction' ? '-' : (entry.qty_plus?.toString() || '-'),
      entry.transaction_type === 'correction' ? '-' : (entry.qty_minus?.toString() || '-'),
      entry.transaction_type === 'correction'
        ? `${entry.balance} (Stock Correction)`
        : entry.balance.toString(),
    ])

    // Add closing balance row
    tableData.push([
      '',
      '',
      '',
      '',
      'Closing Balance',
      totalQtyPlus.toString(),
      totalQtyMinus.toString(),
      closingBalance.toString(),
    ])

    // Create table
    autoTable(doc, {
      head: [['Date/Time', 'Ref', 'Technician / Performed By', 'Device ID', 'Devices', 'Qty+', 'Qty−', 'Balance']],
      body: tableData,
      startY: opening_balance !== undefined && dateRange?.from && dateRange?.to ? 46 : 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })

    // Save PDF
    const fileName = `ledger_${part.sku}_${dayjs().format('YYYY-MM-DD')}.pdf`
    doc.save(fileName)
  }

  const handleExportXLSX = () => {
    if (!ledgerData || !part) return

    // Prepare data
    const worksheetData = [
      ['Item Ledger'],
      [`${part.name} (${part.sku})`],
      [period_label],
      ...(opening_balance !== undefined && dateRange?.from && dateRange?.to
        ? [[`Opening Balance: ${opening_balance}`]]
        : []),
      [], // Empty row
      ['Date/Time', 'Ref', 'Technician / Performed By', 'Device ID', 'Devices', 'Qty+', 'Qty−', 'Balance'],
      ...entries.map((entry) => [
        dayjs(entry.date_time).format('YYYY-MM-DD HH:mm'),
        entry.ref,
        entry.technician_name || '-',
        entry.device_internal_id || '-',
        entry.device_brand && entry.device_model
          ? `${entry.device_brand} ${entry.device_model} ${entry.device_storage || ''} ${entry.device_color || ''}`.trim()
          : '-',
        entry.transaction_type === 'correction' ? '-' : (entry.qty_plus?.toString() || '-'),
        entry.transaction_type === 'correction' ? '-' : (entry.qty_minus?.toString() || '-'),
        entry.transaction_type === 'correction'
          ? `${entry.balance} (Stock Correction)`
          : entry.balance.toString(),
      ]),
      [], // Empty row
      ['Closing Balance', '', '', '', '', totalQtyPlus.toString(), totalQtyMinus.toString(), closingBalance.toString()],
    ]

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(worksheetData)

    // Set column widths
    ws['!cols'] = [
      { wch: 18 }, // Date/Time
      { wch: 20 }, // Ref
      { wch: 25 }, // Technician
      { wch: 15 }, // Device ID
      { wch: 30 }, // Devices
      { wch: 10 }, // Qty+
      { wch: 10 }, // Qty−
      { wch: 10 }, // Balance
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger')

    // Save file
    const fileName = `ledger_${part.sku}_${dayjs().format('YYYY-MM-DD')}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const clearFilters = () => {
    setDateRange(undefined)
    setTechnicianId('all')
    setTransactionType('all')
    setBatchId('all')
  }

  // Get part info from first successful load or show placeholder
  const part = ledgerData?.part
  const entries = ledgerData?.entries || []
  const opening_balance = ledgerData?.opening_balance
  const period_label = ledgerData?.period_label || 'All time'

  // Calculate closing balance
  const closingBalance = entries.length > 0 ? entries[entries.length - 1].balance : (opening_balance ?? part?.quantity_in_stock ?? 0)
  // Exclude corrections from totals - they set absolute values, not changes
  const totalQtyPlus = entries
    .filter(e => e.transaction_type !== 'correction')
    .reduce((sum, e) => sum + (e.qty_plus || 0), 0)
  const totalQtyMinus = entries
    .filter(e => e.transaction_type !== 'correction')
    .reduce((sum, e) => sum + (e.qty_minus || 0), 0)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/inventory">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Item Ledger</h1>
            {part ? (
              <>
                <p className="text-lg text-muted-foreground mt-1">
                  {part.name} ({part.sku})
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {period_label}
                </p>
                {opening_balance !== undefined && dateRange?.from && dateRange?.to && (
                  <p className="text-sm font-medium mt-2">
                    Opening Balance: {opening_balance}
                  </p>
                )}
              </>
            ) : (
              <p className="text-lg text-muted-foreground mt-1">
                Loading...
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF} disabled={isLoading || !ledgerData}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleExportXLSX} disabled={isLoading || !ledgerData}>
              <FileText className="h-4 w-4 mr-2" />
              Download XLSX
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-shrink-0">
              <DateRangePicker
                selectedRange={dateRange}
                onRangeChange={setDateRange}
                className="w-auto"
              />
            </div>
            <div className="flex-shrink-0">
              <Select value={technicianId} onValueChange={setTechnicianId}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="All Technicians" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  {technicians?.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0">
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="remove">Remove</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0">
              <Select value={batchId} onValueChange={setBatchId}>
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="All Batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batches?.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batch_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="h-9"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded">
              <h3 className="font-semibold">Error loading ledger</h3>
              <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Ref</TableHead>
                    <TableHead>Technician / Performed By</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Devices</TableHead>
                    <TableHead className="text-right">Qty+</TableHead>
                    <TableHead className="text-right">Qty−</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No ledger entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-mono text-sm">
                            {dayjs(entry.date_time).format('YYYY-MM-DD HH:mm')}
                          </TableCell>
                          <TableCell>{entry.ref}</TableCell>
                          <TableCell>{entry.technician_name || '-'}</TableCell>
                          <TableCell>
                            {entry.device_internal_id ? (
                              <Link
                                href={`/devices/${entry.device_internal_id}`}
                                className="text-blue-600 hover:underline font-mono"
                              >
                                {entry.device_internal_id}
                              </Link>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.device_brand && entry.device_model
                              ? `${entry.device_brand} ${entry.device_model} ${entry.device_storage || ''} ${entry.device_color || ''}`.trim()
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.transaction_type === 'correction' ? '-' : entry.qty_plus ?? '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.transaction_type === 'correction' ? '-' : entry.qty_minus ?? '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {entry.transaction_type === 'correction' ? (
                              <>
                                {entry.balance}{' '}
                                <span className="text-xs text-muted-foreground font-normal">
                                  (Stock Correction)
                                </span>
                              </>
                            ) : (
                              entry.balance
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Closing Balance Row */}
                      {ledgerData && (
                        <TableRow className="bg-muted/50 font-medium">
                          <TableCell colSpan={5} className="text-right">
                            Closing Balance
                          </TableCell>
                          <TableCell className="text-right">{totalQtyPlus}</TableCell>
                          <TableCell className="text-right">{totalQtyMinus}</TableCell>
                          <TableCell className="text-right">{closingBalance}</TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

