'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useBatches } from '@/modules/batch-intake/hooks/use-batches'
import { LoadingSpinner } from '@/components/common/loading-spinner'

export function BatchList() {
  const { data: batches, isLoading, error } = useBatches()

  if (isLoading) {
    return <LoadingSpinner />
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
              {batch.supplier || 'Unknown Supplier'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Created: {new Date(batch.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm">
              Phones: {batch.phone_count || 0}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}