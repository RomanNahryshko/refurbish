import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/services/auth-helpers'
import { DashboardService } from '@/lib/services/dashboard-service'

export async function GET(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission('dashboard', 'read')
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get URL parameters for date range filtering
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')

    // Create dashboard service instance
    const dashboardService = new DashboardService(supabase)
    
    // Convert date parameters to the format expected by the service
    let dateRange: { from: Date; to: Date } | undefined
    if (fromDate && toDate) {
      dateRange = {
        from: new Date(fromDate),
        to: new Date(toDate)
      }
    }
    
    // Fetch dashboard metrics
    const metrics = await dashboardService.getDashboardMetrics(dateRange)

    return NextResponse.json({ data: metrics })

  } catch (error) {
    console.error('Error in dashboard metrics GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

