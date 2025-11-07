'use client'

import { useParams } from 'next/navigation'
import { PartLedger } from '@/modules/inventory/components/part-ledger'

export default function InventoryLedgerPage() {
  const params = useParams()
  const partId = params.partId as string

  if (!partId) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-red-600">Invalid part ID</p>
      </div>
    )
  }

  return <PartLedger partId={partId} />
}


