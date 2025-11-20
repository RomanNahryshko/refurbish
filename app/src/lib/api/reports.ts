import type { ReportData, Technician } from '@/lib/types/device-refurbishing-report'

export async function fetchTechnicians(): Promise<Technician[]> {
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

export async function fetchReportData(params: URLSearchParams): Promise<ReportData> {
  const response = await fetch(`/api/reports/device-refurbishing?${params}`, {
    credentials: 'include'
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch report data')
  }

  const { data } = await response.json()
  return data
}

