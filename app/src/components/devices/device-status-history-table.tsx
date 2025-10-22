'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { statusConfig } from '@/components/common/device-list-table'
import { DeviceStatusHistory } from '@/lib/types/business-types'
import { Clock, User, FileText } from 'lucide-react'

/**
 * Format technical notes into user-friendly text
 * - Replaces underscores with spaces
 * - Capitalizes repair type names (battery_change → Battery Change)
 * - Capitalizes status names (awaiting_repair → Awaiting Repair)
 * 
 * @param notes - Raw notes from database
 * @returns Formatted, user-friendly text
 */
function formatNotes(notes: string): string {
  if (!notes) return notes
  
  let formatted = notes.replace(/_/g, ' ')
  
  const repairTypes = ['battery change', 'glass change', 'housing change', 'software update', 'other']
  const statusNames = ['awaiting repair', 'in repair', 'final qc', 'graded', 'pending', 'in progress', 'completed']
  const termsToCapitalize = [...repairTypes, ...statusNames]
  
  termsToCapitalize.forEach(term => {
    const regex = new RegExp(term, 'gi')
    formatted = formatted.replace(regex, (match) => {
      return match
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    })
  })
  
  return formatted
}

interface DeviceStatusHistoryTableProps {
  deviceId: string
  statusHistory: DeviceStatusHistory[]
  isLoading: boolean
  error: Error | null
}

export function DeviceStatusHistoryTable({
  deviceId: _deviceId,
  statusHistory,
  isLoading,
  error
}: DeviceStatusHistoryTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Device Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
            <span className="ml-2">Loading status history...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Device Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">Error loading status history: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!statusHistory || statusHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Device Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="mx-auto h-8 w-8 mb-2" />
            <p>No status changes recorded for this device</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  console.log(statusHistory, 'statusHistory')
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Device Status History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pr-6 font-medium">Date & Time</th>
                <th className="pb-3 px-6 font-medium">Status Change</th>
                <th className="pb-3 px-6 font-medium">Changed By</th>
                <th className="pb-3 pl-6 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {statusHistory.map((history) => {
                const oldStatus = history.old_status ? statusConfig[history.old_status] : null
                const newStatus = statusConfig[history.new_status]
                const OldStatusIcon = oldStatus?.icon
                const NewStatusIcon = newStatus?.icon

                return (
                  <tr key={history.id} className="hover:bg-gray-50">
                    <td className="py-4 pr-6">
                      <div className="text-sm">
                        <div className="font-medium">
                          {new Date(history.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">
                          {new Date(history.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {oldStatus && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {OldStatusIcon && <OldStatusIcon className="h-3 w-3 mr-1" />}
                              {oldStatus.label}
                            </Badge>
                            <span className="text-gray-400">→</span>
                          </>
                        )}
                        <Badge variant="default" className="text-xs">
                          {NewStatusIcon && <NewStatusIcon className="h-3 w-3 mr-1" />}
                          {newStatus.label}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div className="text-sm">
                          {history.user_profile ? (
                            <>
                              <div className="font-medium">
                                {history.user_profile.full_name || 'Unknown Name'}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {history.user_profile.email || 'No email'}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium text-gray-500">
                                Unknown User
                              </div>
                              <div className="text-gray-400 text-xs">
                                User not found
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pl-6">
                      {history.notes ? (
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{formatNotes(history.notes)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No notes</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
