'use client'

import { useState } from 'react'
import { usePhones, useUpdatePhoneStatus } from '@/lib/hooks/use-phones'
import { PhoneStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/loading-spinner'

/**
 * Example component showing how to use React Query hooks
 * This demonstrates loading states, error handling, and mutations
 */
export function PhoneListExample() {
  const [statusFilter, setStatusFilter] = useState<PhoneStatus | undefined>()
  
  // Fetch phones with automatic caching and refetching
  const { data: phones, isLoading, error, refetch } = usePhones({ status: statusFilter })
  
  // Mutation hook for updating phone status
  const updateStatus = useUpdatePhoneStatus()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading phones: {error.message}
        <Button onClick={() => refetch()} className="ml-2">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Phones ({phones?.length || 0})</h2>
      
      {/* Filter buttons */}
      <div className="flex gap-2">
        <Button 
          variant={!statusFilter ? 'default' : 'outline'}
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        <Button 
          variant={statusFilter === 'In Repair' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('In Repair')}
        >
          In Repair
        </Button>
        <Button 
          variant={statusFilter === 'Graded' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('Graded')}
        >
          Graded
        </Button>
      </div>

      {/* Phone list */}
      <div className="grid gap-4">
        {phones?.map((phone) => (
          <div key={phone.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{phone.model || 'Unknown Model'}</p>
                <p className="text-sm text-gray-600">IMEI: {phone.imei}</p>
                <p className="text-sm">Status: {phone.status}</p>
              </div>
              
              {/* Update status button - shows optimistic updates */}
              <Button
                onClick={() => 
                  updateStatus.mutate({
                    id: phone.id,
                    status: phone.status === 'In Repair' ? 'Final QC' : 'In Repair'
                  })
                }
                disabled={updateStatus.isPending}
                size="sm"
              >
                {updateStatus.isPending ? 'Updating...' : 'Toggle Status'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}