import { DateRange } from 'react-day-picker'
import dayjs from 'dayjs'

export function getTodayAtMidnight(): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

export function formatDateRange(from?: Date, to?: Date): string {
  if (!from || !to) return 'Not selected'
  return `${dayjs(from).format('DD MMM')} - ${dayjs(to).format('DD MMM YYYY')}`
}

export function buildQueryParams(
  dateRange: DateRange | undefined,
  selectedTechnicians: string[],
  selectedModel: string,
  selectedRepairTypes: string[]
): URLSearchParams {
  const params = new URLSearchParams()
  
  if (dateRange?.from && dateRange?.to) {
    params.append('dateFrom', dayjs(dateRange.from).format('YYYY-MM-DD'))
    params.append('dateTo', dayjs(dateRange.to).format('YYYY-MM-DD'))
  }
  
  if (selectedTechnicians.length > 0) {
    params.append('technicianIds', selectedTechnicians.join(','))
  }
  
  if (selectedModel !== 'all') {
    params.append('model', selectedModel)
  }
  
  if (selectedRepairTypes.length > 0) {
    params.append('repairTypes', selectedRepairTypes.join(','))
  }
  
  return params
}

