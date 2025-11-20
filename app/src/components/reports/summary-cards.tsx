'use client'

import { DateRange } from 'react-day-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateRange } from '@/lib/helpers/device-refurbishing-report-utils'
import type { ReportData } from '@/lib/types/device-refurbishing-report'

interface SummaryCardsProps {
  reportData: ReportData
  dateRange: DateRange | undefined
  onDevicesClick: () => void
  onJobsClick: () => void
}

export function SummaryCards({
  reportData,
  dateRange,
  onDevicesClick,
  onJobsClick
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={onDevicesClick}>
        <CardHeader>
          <CardTitle className="text-lg">Devices Repaired</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{reportData.devicesCount}</div>
          <p className="text-sm text-muted-foreground mt-1">Click to view details</p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={onJobsClick}>
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
            {formatDateRange(dateRange?.from, dateRange?.to)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

