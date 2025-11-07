import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/services/auth-helpers'
import { apiFactory } from '@/lib/api/api-factory'
import { LedgerFilters } from '@/lib/types/business-types'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const authError = await requirePermission('spare_parts', 'read')
  if (authError) return authError

  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    
    const filters: LedgerFilters = {
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      technician_id: searchParams.get('technician_id') || undefined,
      transaction_type: searchParams.get('transaction_type') as LedgerFilters['transaction_type'] || undefined,
      batch_id: searchParams.get('batch_id') || undefined,
    }

    const inventoryApi = await apiFactory.getInventoryAPI()
    const ledgerData = await inventoryApi.getPartLedger(id, filters)

    return NextResponse.json(ledgerData)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ledger data' },
      { status: 500 }
    )
  }
}


