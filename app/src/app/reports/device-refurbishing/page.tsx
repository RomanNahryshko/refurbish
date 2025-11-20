'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DateRange } from 'react-day-picker'
import dayjs from 'dayjs'
import { Download } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangePicker } from '@/components/dashboard/date-range-picker'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { REPAIR_TYPE_LABELS } from '@/lib/constants'
import { getTodayAtMidnight, buildQueryParams } from '@/lib/helpers/device-refurbishing-report-utils'
import { fetchTechnicians, fetchReportData } from '@/lib/api/reports'
import { exportReportToPDF } from '@/lib/helpers/pdf-export'
import { TechnicianFilter } from '@/components/reports/technician-filter'
import { RepairTypeFilter } from '@/components/reports/repair-type-filter'
import { SummaryCards } from '@/components/reports/summary-cards'
import { ReportTable } from '@/components/reports/report-table'
import type { ReportData, Technician } from '@/lib/types/device-refurbishing-report'

export default function DeviceRefurbishingReportPage() {
  const router = useRouter()
  const today = useMemo(() => getTodayAtMidnight(), [])

  // State
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: today
  })
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('all')
  const [selectedRepairTypes, setSelectedRepairTypes] = useState<string[]>([])

  // Queries
  const { data: technicians } = useQuery<Technician[]>({
    queryKey: ['all-technicians'],
    queryFn: fetchTechnicians
  })

  const normalizedFilters = useMemo(() => ({
    dateFrom: dateRange?.from ? dayjs(dateRange.from).format('YYYY-MM-DD') : null,
    dateTo: dateRange?.to ? dayjs(dateRange.to).format('YYYY-MM-DD') : null,
    technicians: selectedTechnicians.sort().join(','),
    model: selectedModel,
    repairTypes: selectedRepairTypes.sort().join(','),
    batch: 'all'
  }), [dateRange, selectedTechnicians, selectedModel, selectedRepairTypes])

  const { data: reportData, isLoading, error } = useQuery<ReportData>({
    queryKey: ['device-refurbishing-report', normalizedFilters],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) {
        throw new Error('Date range is required')
      }
      const params = buildQueryParams(dateRange, selectedTechnicians, selectedModel, selectedRepairTypes)
      return fetchReportData(params)
    },
    enabled: !!dateRange?.from && !!dateRange?.to
  })

  // Computed values
  const uniqueModels = useMemo(
    () => [...new Set(reportData?.byModelBrand?.map(item => item.model) || [])],
    [reportData]
  )

  const availableTechnicians = useMemo(() => {
    const techMap = new Map<string, Technician>()
    
    technicians?.forEach(tech => techMap.set(tech.id, tech))
    
    reportData?.byTechnician.forEach(t => {
      if (!techMap.has(t.technicianId)) {
        techMap.set(t.technicianId, {
          id: t.technicianId,
          full_name: t.technicianName,
          technician_level: t.technicianLevel
        })
      }
    })
    
    return Array.from(techMap.values()).sort((a, b) => 
      a.full_name.localeCompare(b.full_name)
    )
  }, [technicians, reportData])

  // Handlers
  const handleTechnicianToggle = (technicianId: string) => {
    setSelectedTechnicians(prev =>
      prev.includes(technicianId)
        ? prev.filter(id => id !== technicianId)
        : [...prev, technicianId]
    )
  }

  const handleRepairTypeToggle = (repairType: string) => {
    setSelectedRepairTypes(prev =>
      prev.includes(repairType)
        ? prev.filter(type => type !== repairType)
        : [...prev, repairType]
    )
  }

  const handleExportPDF = () => {
    if (reportData) {
      exportReportToPDF(reportData)
    }
  }

  const handleDevicesClick = () => {
    if (!dateRange?.from || !dateRange?.to) return
    const params = buildQueryParams(dateRange, selectedTechnicians, selectedModel, selectedRepairTypes)
    params.append('fromReport', 'true')
    router.push(`/devices?${params}`)
  }

  const handleJobsClick = () => {
    if (!dateRange?.from || !dateRange?.to) return
    const params = new URLSearchParams()
    params.append('fromReport', 'true')
    params.append('dateFrom', dayjs(dateRange.from).format('YYYY-MM-DD'))
    params.append('dateTo', dayjs(dateRange.to).format('YYYY-MM-DD'))
    
    selectedTechnicians.forEach(id => params.append('technicianId', id))
    selectedRepairTypes.forEach(type => params.append('repairType', type))
    
    router.push(`/repair-jobs?${params}`)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Device Refurbishing Report</h1>
          <p className="text-muted-foreground">
            Accountability report: who did the work, on what models, and what repair types
          </p>
        </div>
        <Button onClick={handleExportPDF} disabled={!reportData || isLoading}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select date range and filters to generate the report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date range</Label>
              <DateRangePicker
                selectedRange={dateRange}
                onRangeChange={setDateRange}
                className="w-auto"
              />
            </div>

            <div className="border-t border-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <TechnicianFilter
                technicians={availableTechnicians}
                selectedTechnicians={selectedTechnicians}
                onToggle={handleTechnicianToggle}
              />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {uniqueModels.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <RepairTypeFilter
                selectedRepairTypes={selectedRepairTypes}
                onToggle={handleRepairTypeToggle}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center text-destructive">
              Error loading report: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Data */}
      {reportData && !isLoading && (
        <>
          <SummaryCards
            reportData={reportData}
            dateRange={dateRange}
            onDevicesClick={handleDevicesClick}
            onJobsClick={handleJobsClick}
          />

          {/* By Technician */}
          {reportData.byTechnician.length > 0 && (
            <ReportTable title="By Technician" headers={['Technician', 'Jobs', 'Devices']}>
              {reportData.byTechnician.map(tech => (
                <TableRow key={tech.technicianId}>
                  <TableCell>
                    {tech.technicianName} {tech.technicianLevel && (
                      <Badge variant="outline" className="ml-2">{tech.technicianLevel}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{tech.jobs}</TableCell>
                  <TableCell>{tech.devices}</TableCell>
                </TableRow>
              ))}
            </ReportTable>
          )}

          {/* By Model */}
          {reportData.byModelBrand.length > 0 && (
            <ReportTable title="By Model" headers={['Model', 'Jobs', '']}>
              {reportData.byModelBrand.map((item, idx) => (
                <TableRow key={`${item.brand}-${item.model}-${idx}`}>
                  <TableCell>{item.model}</TableCell>
                  <TableCell>{item.jobs}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </ReportTable>
          )}

          {/* By Repair Type */}
          {reportData.byRepairType.length > 0 && (
            <ReportTable title="By Repair Type" headers={['Repair Type', 'Jobs', '']}>
              {reportData.byRepairType.map(item => (
                <TableRow key={item.repairType}>
                  <TableCell>{REPAIR_TYPE_LABELS[item.repairType] || item.repairType}</TableCell>
                  <TableCell>{item.jobs}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </ReportTable>
          )}

          {/* By Batch */}
          {reportData.byBatch.length > 0 && (
            <ReportTable title="By Batch" headers={['Batch', 'Devices', 'Jobs']}>
              {reportData.byBatch.map(item => (
                <TableRow key={item.batchId}>
                  <TableCell>{item.batchNumber}</TableCell>
                  <TableCell>{item.devices}</TableCell>
                  <TableCell>{item.jobs}</TableCell>
                </TableRow>
              ))}
            </ReportTable>
          )}

          {/* Empty State */}
          {reportData.devicesCount === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  No data found for the selected filters
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
