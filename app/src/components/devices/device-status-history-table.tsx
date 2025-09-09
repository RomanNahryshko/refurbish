'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { statusConfig } from '@/components/common/device-list-table'
import { DeviceStatusHistory } from '@/lib/types/business-types'
import { Clock, User, FileText } from 'lucide-react'

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
                <th className="pb-2 font-medium">Date & Time</th>
                <th className="pb-2 font-medium">Status Change</th>
                <th className="pb-2 font-medium">Changed By</th>
                <th className="pb-2 font-medium">Notes</th>
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
                    <td className="py-3">
                      <div className="text-sm">
                        <div className="font-medium">
                          {new Date(history.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">
                          {new Date(history.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
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
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div className="text-sm">
                          {history.changed_by ? (
                            <>
                              <div className="font-medium">
                                User ID: {history.changed_by}
                              </div>
                              <div className="text-xs text-gray-500">
                                User details not loaded
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium text-gray-500">
                                Unknown User
                              </div>
                              <div className="text-xs text-gray-400">
                                User data not available
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      {history.notes ? (
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{history.notes}</span>
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
