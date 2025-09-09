'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useBatches } from '@/modules/batch-intake/hooks/use-batches'
import { LoadingSpinner } from '@/components/common/loading-spinner'

export function BatchList() {
  const { data: batches, isLoading, error, refetch, isFetching } = useBatches()
  
  // Refetch batches every time the component mounts
  React.useEffect(() => {
    refetch()
  }, [refetch])

  if (isLoading) {
    return <LoadingSpinner />
  }

  // Show refetching indicator if data exists but we're refreshing
  if (isFetching && batches && batches.length > 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {batches.map((batch) => (
          <Card key={batch.id} className="opacity-50">
            <CardHeader>
              <CardTitle>Batch #{batch.id.slice(0, 8)}</CardTitle>
              <CardDescription>
                {batch.supplier_name || 'Unknown Supplier'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(batch.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm">
                Devices: {batch.device_count || 0}
              </p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <LoadingSpinner size="sm" />
                <span>Refreshing...</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading batches: {error.message}
      </div>
    )
  }

  if (!batches || batches.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-muted-foreground mb-4">No batches found</p>
          <Button>Create First Batch</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {batches.map((batch) => (
        <Card key={batch.id}>
          <CardHeader>
            <CardTitle>Batch #{batch.id.slice(0, 8)}</CardTitle>
            <CardDescription>
              {batch.supplier_name || 'Unknown Supplier'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Created: {new Date(batch.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm">
              Devices: {batch.device_count || 0}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}