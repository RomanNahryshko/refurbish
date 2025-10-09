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
    
    // Log the request for debugging
    console.log('Dashboard metrics API called with date range:', { fromDate, toDate })

    // Create dashboard service instance
    const dashboardService = new DashboardService(supabase)
    
    // Convert date parameters to the format expected by the service
    let dateRange: { from: Date; to: Date } | undefined
    if (fromDate && toDate) {
      // Parse dates in YYYY-MM-DD format and create Date objects in local timezone
      const fromParts = fromDate.split('-');
      const toParts = toDate.split('-');
      
      dateRange = {
        from: new Date(parseInt(fromParts[0]), parseInt(fromParts[1]) - 1, parseInt(fromParts[2]), 0, 0, 0, 0),
        to: new Date(parseInt(toParts[0]), parseInt(toParts[1]) - 1, parseInt(toParts[2]), 23, 59, 59, 999)
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

