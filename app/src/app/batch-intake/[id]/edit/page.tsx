'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BatchForm } from '@/modules/batch-intake/components/batch-form'
import { toast } from 'sonner'
import { useBatch, useUpdateBatch } from '@/lib/hooks/use-batches'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { BatchFormInputData } from '@/lib/types/business-types'

export default function EditBatchPage() {
  const params = useParams()
  const router = useRouter()
  const batchId = params.id as string
  
  const [isLoading, setIsLoading] = useState(false)
  
  // Get batch data from API
  const { data: batch, isLoading: batchLoading, error: batchError } = useBatch(batchId)
  const updateBatch = useUpdateBatch()
  
  // Show loading state
  if (batchLoading) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  // Show error state
  if (batchError) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-3" />
          <h3 className="text-lg font-semibold text-red-600">Error Loading Batch</h3>
          <p className="text-gray-600 mb-4">{batchError.message}</p>
          <Link href="/batch-intake">
            <Button variant="outline">Back to Batches</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Show not found state
  if (!batch) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-3" />
          <h3 className="text-lg font-semibold text-red-600">Batch Not Found</h3>
          <p className="text-gray-600 mb-4">The batch you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Link href="/batch-intake">
            <Button variant="outline">Back to Batches</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (formData: BatchFormInputData) => {
    setIsLoading(true)
    
    try {
      // Validate required fields
      if (!formData.supplier_id || !formData.device_count) {
        toast.error('Please fill in all required fields')
        return
      }

      // Call the update batch mutation
              await updateBatch.mutateAsync({
          id: batchId,
          data: {
            supplier_id: formData.supplier_id,
            invoice_number: formData.invoice_number || undefined,
            invoice_date: formData.invoice_date || undefined,
            invoice_amount: formData.invoice_amount ? parseFloat(formData.invoice_amount) : undefined,
            device_count: parseInt(formData.device_count),
            received_date: formData.received_date,
            notes: formData.notes || undefined
          }
        })

      toast.success('Batch updated successfully!')
      router.push('/batch-intake')
    } catch {
      toast.error('Failed to update batch')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/batch-intake')
  }

  // Prepare initial data for the form
  const initialData = {
    supplier_id: batch.supplier_id,
    invoice_number: batch.invoice_number || '',
    invoice_date: batch.invoice_date || '',
    invoice_amount: batch.invoice_amount?.toString() || '',
    device_count: batch.device_count.toString(),
    received_date: batch.received_date || '',
    notes: batch.notes || ''
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/batch-intake" className="cursor-pointer">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Batch</h1>
          <p className="text-muted-foreground">
            Editing: {batch.batch_number}
          </p>
        </div>
      </div>

      {/* Form */}
      <BatchForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEditing={true}
        isLoading={isLoading || updateBatch.isPending}
      />
    </div>
  )
}