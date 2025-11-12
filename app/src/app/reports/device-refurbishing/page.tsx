'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DateRange } from 'react-day-picker'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Download } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangePicker } from '@/components/dashboard/date-range-picker'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { REPAIR_TYPES } from '@/lib/constants'

interface ReportData {
  devicesCount: number
  jobsCount: number
  byTechnician: Array<{
    technicianId: string
    technicianName: string
    technicianLevel: string
    jobs: number
    devices: number
  }>
  byModelBrand: Array<{
    brand: string
    model: string
    jobs: number
  }>
  byRepairType: Array<{
    repairType: string
    jobs: number
  }>
  byBatch: Array<{
    batchId: string
    batchNumber: string
    devices: number
    jobs: number
  }>
  dateFrom: string
  dateTo: string
  availableBrands?: string[]
  availableModelsByBrand?: Record<string, string[]>
}

interface Technician {
  id: string
  full_name: string
  technician_level: string | null
}

const REPAIR_TYPE_LABELS: Record<string, string> = {
  housing_change: 'Housing Change',
  glass_change: 'Glass Change',
  battery_change: 'Battery Change',
  software_update: 'Software Update',
  other: 'Other'
}

export default function DeviceRefurbishingReportPage() {
  const router = useRouter()
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: today
  })
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [selectedModel, setSelectedModel] = useState<string>('all')
  const [selectedRepairTypes, setSelectedRepairTypes] = useState<string[]>([])
  const [technicianPopoverOpen, setTechnicianPopoverOpen] = useState(false)
  const [repairTypePopoverOpen, setRepairTypePopoverOpen] = useState(false)

  // Fetch technicians from admin users API
  const { data: technicians } = useQuery<Technician[]>({
    queryKey: ['all-technicians'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/users?role=technician', {
          credentials: 'include'
        })
        if (!response.ok) return []
        const { data } = await response.json()
        return (data || []).map((user: any) => ({
          id: user.id,
          full_name: user.full_name,
          technician_level: user.technician_level
        }))
      } catch {
        return []
      }
    }
  })

  // Normalize filters for query key
  const normalizedFilters = useMemo(() => {
    return {
      dateFrom: dateRange?.from ? dayjs(dateRange.from).format('YYYY-MM-DD') : null,
      dateTo: dateRange?.to ? dayjs(dateRange.to).format('YYYY-MM-DD') : null,
      technicians: selectedTechnicians.sort().join(','),
      brand: selectedBrand,
      model: selectedModel,
      repairTypes: selectedRepairTypes.sort().join(','),
      batch: 'all'
    }
  }, [dateRange, selectedTechnicians, selectedBrand, selectedModel, selectedRepairTypes])

  // Fetch report data
  const { data: reportData, isLoading, error } = useQuery<ReportData>({
    queryKey: ['device-refurbishing-report', normalizedFilters],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) {
        throw new Error('Date range is required')
      }

      const params = new URLSearchParams()
      params.append('dateFrom', dayjs(dateRange.from).format('YYYY-MM-DD'))
      params.append('dateTo', dayjs(dateRange.to).format('YYYY-MM-DD'))
      
      if (selectedTechnicians.length > 0) {
        params.append('technicianIds', selectedTechnicians.join(','))
      }
      if (selectedBrand !== 'all') {
        params.append('brand', selectedBrand)
      }
      if (selectedModel !== 'all') {
        params.append('model', selectedModel)
      }
      if (selectedRepairTypes.length > 0) {
        params.append('repairTypes', selectedRepairTypes.join(','))
      }

      const response = await fetch(`/api/reports/device-refurbishing?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch report data')
      }

      const { data } = await response.json()
      return data
    },
    enabled: !!dateRange?.from && !!dateRange?.to
  })

  // Get unique brands and models from report data (for filter dropdowns)
  const uniqueBrands = useMemo(() => {
    // Use availableBrands from API if available, otherwise fall back to byModelBrand
    if (reportData?.availableBrands && reportData.availableBrands.length > 0) {
      return reportData.availableBrands
    }
    if (reportData?.byModelBrand) {
      return [...new Set(reportData.byModelBrand.map(item => item.brand).filter(Boolean))]
    }
    return []
  }, [reportData])

  const uniqueModels = useMemo(() => {
    if (selectedBrand === 'all') return []
    // Use availableModelsByBrand from API if available
    if (reportData?.availableModelsByBrand && reportData.availableModelsByBrand[selectedBrand]) {
      return reportData.availableModelsByBrand[selectedBrand]
    }
    // Fall back to byModelBrand
    if (reportData?.byModelBrand) {
      return reportData.byModelBrand
        .filter(item => item.brand === selectedBrand)
        .map(item => item.model)
        .filter(Boolean)
    }
    return []
  }, [reportData, selectedBrand])

  // Get technicians - combine from API and report data
  const availableTechnicians = useMemo(() => {
    const techMap = new Map<string, Technician>()
    
    // Add technicians from API (all technicians)
    if (technicians) {
      technicians.forEach(tech => {
        techMap.set(tech.id, tech)
      })
    }
    
    // Add technicians from report data (technicians who have jobs in the report)
    if (reportData?.byTechnician) {
      reportData.byTechnician.forEach(t => {
        if (!techMap.has(t.technicianId)) {
          techMap.set(t.technicianId, {
            id: t.technicianId,
            full_name: t.technicianName,
            technician_level: t.technicianLevel
          })
        }
      })
    }
    
    return Array.from(techMap.values()).sort((a, b) => 
      a.full_name.localeCompare(b.full_name)
    )
  }, [technicians, reportData])

  const handleExportPDF = () => {
    if (!reportData) return

    const doc = new jsPDF()
    
    // Constants for margins and table width
    const leftMargin = 14
    const rightMargin = 14
    const pageWidth = 210 // A4 width in mm
    const tableWidth = pageWidth - leftMargin - rightMargin // 182mm
    
    // Header
    doc.setFontSize(18)
    doc.text('Device Refurbishing Report', leftMargin, 20)
    doc.setFontSize(12)
    doc.text(
      `Date Range: ${dayjs(reportData.dateFrom).format('DD MMM YYYY')} - ${dayjs(reportData.dateTo).format('DD MMM YYYY')}`,
      leftMargin,
      28
    )

    let startY = 38

    // Summary
    doc.setFontSize(14)
    doc.text('Summary', leftMargin, startY)
    startY += 8
    doc.setFontSize(11)
    doc.text(`Devices Repaired: ${reportData.devicesCount}`, leftMargin, startY)
    startY += 6
    doc.text(`Jobs Completed: ${reportData.jobsCount}`, leftMargin, startY)
    startY += 10

    // By Technician
    if (reportData.byTechnician.length > 0) {
      doc.setFontSize(14)
      doc.text('By Technician', leftMargin, startY)
      startY += 8
      
      const techTableData = reportData.byTechnician.map(tech => [
        `${tech.technicianName}${tech.technicianLevel ? ` (${tech.technicianLevel})` : ''}`,
        tech.jobs.toString(),
        tech.devices.toString()
      ])

      autoTable(doc, {
        head: [['Technician', 'Jobs', 'Devices']],
        body: techTableData,
        startY,
        margin: { left: leftMargin, right: rightMargin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 66, 66] },
        columnStyles: {
          0: { cellWidth: tableWidth * 0.5 }, // 50% = 91mm
          1: { cellWidth: tableWidth * 0.25 }, // 25% = 45.5mm
          2: { cellWidth: tableWidth * 0.25 } // 25% = 45.5mm
        }
      })
      startY = (doc as any).lastAutoTable.finalY + 10
    }

    // By Model/Brand
    if (reportData.byModelBrand.length > 0) {
      doc.setFontSize(14)
      doc.text('By Model/Brand', leftMargin, startY)
      startY += 8
      
      const modelTableData = reportData.byModelBrand.map(item => [
        item.brand,
        item.model,
        item.jobs.toString()
      ])

      autoTable(doc, {
        head: [['Brand', 'Model', 'Jobs']],
        body: modelTableData,
        startY,
        margin: { left: leftMargin, right: rightMargin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 66, 66] },
        columnStyles: {
          0: { cellWidth: tableWidth * 0.5 }, // 50% = 91mm
          1: { cellWidth: tableWidth * 0.25 }, // 25% = 45.5mm
          2: { cellWidth: tableWidth * 0.25 } // 25% = 45.5mm
        }
      })
      startY = (doc as any).lastAutoTable.finalY + 10
    }

    // By Repair Type
    if (reportData.byRepairType.length > 0) {
      doc.setFontSize(14)
      doc.text('By Repair Type', leftMargin, startY)
      startY += 8
      
      const repairTableData = reportData.byRepairType.map(item => [
        REPAIR_TYPE_LABELS[item.repairType] || item.repairType,
        item.jobs.toString(),
        '' // Empty third column to match layout
      ])

      autoTable(doc, {
        head: [['Repair Type', 'Jobs', '']],
        body: repairTableData,
        startY,
        margin: { left: leftMargin, right: rightMargin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 66, 66] },
        columnStyles: {
          0: { cellWidth: tableWidth * 0.5 }, // 50% = 91mm
          1: { cellWidth: tableWidth * 0.25 }, // 25% = 45.5mm
          2: { cellWidth: tableWidth * 0.25 } // 25% = 45.5mm (empty)
        }
      })
      startY = (doc as any).lastAutoTable.finalY + 10
    }

    // By Batch
    if (reportData.byBatch.length > 0) {
      doc.setFontSize(14)
      doc.text('By Batch', leftMargin, startY)
      startY += 8
      
      const batchTableData = reportData.byBatch.map(item => [
        item.batchNumber,
        item.devices.toString(),
        item.jobs.toString()
      ])

      autoTable(doc, {
        head: [['Batch', 'Devices', 'Jobs']],
        body: batchTableData,
        startY,
        margin: { left: leftMargin, right: rightMargin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 66, 66] },
        columnStyles: {
          0: { cellWidth: tableWidth * 0.5 }, // 50% = 91mm
          1: { cellWidth: tableWidth * 0.25 }, // 25% = 45.5mm
          2: { cellWidth: tableWidth * 0.25 } // 25% = 45.5mm
        }
      })
    }

    // Save PDF
    const fileName = `device-refurbishing-report_${dayjs().format('YYYY-MM-DD')}.pdf`
    doc.save(fileName)
  }

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

  const handleDevicesClick = () => {
    if (!dateRange?.from || !dateRange?.to) return
    const params = new URLSearchParams()
    params.append('fromReport', 'true')
    params.append('dateFrom', dayjs(dateRange.from).format('YYYY-MM-DD'))
    params.append('dateTo', dayjs(dateRange.to).format('YYYY-MM-DD'))
    if (selectedBrand !== 'all') params.append('brand', selectedBrand)
    if (selectedModel !== 'all') params.append('model', selectedModel)
    if (selectedTechnicians.length > 0) {
      selectedTechnicians.forEach(id => params.append('technicianId', id))
    }
    if (selectedRepairTypes.length > 0) {
      selectedRepairTypes.forEach(type => params.append('repairType', type))
    }
    router.push(`/devices?${params}`)
  }

  const handleJobsClick = () => {
    if (!dateRange?.from || !dateRange?.to) return
    const params = new URLSearchParams()
    params.append('fromReport', 'true')
    params.append('dateFrom', dayjs(dateRange.from).format('YYYY-MM-DD'))
    params.append('dateTo', dayjs(dateRange.to).format('YYYY-MM-DD'))
    if (selectedTechnicians.length > 0) {
      selectedTechnicians.forEach(id => params.append('technicianId', id))
    }
    if (selectedRepairTypes.length > 0) {
      selectedRepairTypes.forEach(type => params.append('repairType', type))
    }
    router.push(`/repair-jobs?${params}`)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
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
            {/* Date Range Section - Required */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date range</Label>
              <DateRangePicker
                selectedRange={dateRange}
                onRangeChange={setDateRange}
                className="w-auto"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Technician(s) Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Technician(s)</Label>
                <Popover open={technicianPopoverOpen} onOpenChange={setTechnicianPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 w-full justify-between">
                      {selectedTechnicians.length === 0
                        ? 'All Technicians'
                        : `${selectedTechnicians.length} selected`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-2">
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {availableTechnicians.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-2">
                          No technicians found
                        </div>
                      ) : (
                        availableTechnicians.map(tech => (
                          <div key={tech.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                            <Checkbox
                              id={`tech-${tech.id}`}
                              checked={selectedTechnicians.includes(tech.id)}
                              onCheckedChange={() => handleTechnicianToggle(tech.id)}
                            />
                            <Label
                              htmlFor={`tech-${tech.id}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {tech.full_name} {tech.technician_level && `(${tech.technician_level})`}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Brand/Model Section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Brand/Model</Label>
                <div className="space-y-3">
                  {/* Brand */}
                  <div className="space-y-2">
                    <Select value={selectedBrand} onValueChange={(value) => {
                      setSelectedBrand(value)
                      setSelectedModel('all')
                    }}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="All Brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brands</SelectItem>
                        {uniqueBrands.map(brand => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Model */}
                  <div className="space-y-2">
                    <Select value={selectedModel} onValueChange={setSelectedModel} disabled={selectedBrand === 'all'}>
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
                </div>
              </div>

              {/* Repair Type Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Repair Type</Label>
                <Popover open={repairTypePopoverOpen} onOpenChange={setRepairTypePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 w-full justify-between">
                      {selectedRepairTypes.length === 0
                        ? 'All Types'
                        : `${selectedRepairTypes.length} selected`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-2">
                    <div className="space-y-2">
                      {Object.entries(REPAIR_TYPES).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                          <Checkbox
                            id={`repair-${key}`}
                            checked={selectedRepairTypes.includes(value)}
                            onCheckedChange={() => handleRepairTypeToggle(value)}
                          />
                          <Label htmlFor={`repair-${key}`} className="text-sm cursor-pointer flex-1">
                            {REPAIR_TYPE_LABELS[value] || value}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={handleDevicesClick}>
              <CardHeader>
                <CardTitle className="text-lg">Devices Repaired</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData.devicesCount}</div>
                <p className="text-sm text-muted-foreground mt-1">Click to view details</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={handleJobsClick}>
              <CardHeader>
                <CardTitle className="text-lg">Jobs Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData.jobsCount}</div>
                <p className="text-sm text-muted-foreground mt-1">Click to view details</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Date Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {dateRange?.from && dateRange?.to
                    ? `${dayjs(dateRange.from).format('DD MMM')} - ${dayjs(dateRange.to).format('DD MMM YYYY')}`
                    : reportData
                    ? `${dayjs(reportData.dateFrom).format('DD MMM')} - ${dayjs(reportData.dateTo).format('DD MMM YYYY')}`
                    : 'Not selected'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* By Technician */}
          {reportData.byTechnician.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>By Technician</CardTitle>
              </CardHeader>
              <CardContent>
                <Table className="table-fixed w-full">
                  <colgroup>
                    <col className="w-[50%]" />
                    <col className="w-[25%]" />
                    <col className="w-[25%]" />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Technician</TableHead>
                      <TableHead className="">Jobs</TableHead>
                      <TableHead className="">Devices</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.byTechnician.map(tech => (
                      <TableRow key={tech.technicianId}>
                        <TableCell>
                          {tech.technicianName} {tech.technicianLevel && (
                            <Badge variant="outline" className="ml-2">{tech.technicianLevel}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="">{tech.jobs}</TableCell>
                        <TableCell className="">{tech.devices}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* By Model/Brand */}
          {reportData.byModelBrand.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>By Model/Brand</CardTitle>
              </CardHeader>
              <CardContent>
                <Table className="table-fixed w-full">
                  <colgroup>
                    <col className="w-[50%]" />
                    <col className="w-[25%]" />
                    <col className="w-[25%]" />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead className="">Jobs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.byModelBrand.map((item, idx) => (
                      <TableRow key={`${item.brand}-${item.model}-${idx}`}>
                        <TableCell>{item.brand}</TableCell>
                        <TableCell>{item.model}</TableCell>
                        <TableCell className="">{item.jobs}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* By Repair Type */}
          {reportData.byRepairType.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>By Repair Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Table className="table-fixed w-full">
                  <colgroup>
                    <col className="w-[50%]" />
                    <col className="w-[25%]" />
                    <col className="w-[25%]" />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repair Type</TableHead>
                      <TableHead className="">Jobs</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.byRepairType.map(item => (
                      <TableRow key={item.repairType}>
                        <TableCell>{REPAIR_TYPE_LABELS[item.repairType] || item.repairType}</TableCell>
                        <TableCell className="">{item.jobs}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* By Batch */}
          {reportData.byBatch.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>By Batch</CardTitle>
              </CardHeader>
              <CardContent>
                <Table className="table-fixed w-full">
                  <colgroup>
                    <col className="w-[50%]" />
                    <col className="w-[25%]" />
                    <col className="w-[25%]" />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead className="">Devices</TableHead>
                      <TableHead className="">Jobs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.byBatch.map(item => (
                      <TableRow key={item.batchId}>
                        <TableCell>{item.batchNumber}</TableCell>
                        <TableCell className="">{item.devices}</TableCell>
                        <TableCell className="">{item.jobs}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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

