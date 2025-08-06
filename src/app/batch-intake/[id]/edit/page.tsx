'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BatchForm } from '@/modules/batch-intake/components/batch-form'
import { mockBatches, mockSuppliers } from '@/lib/mock-data'
import { toast } from 'sonner'

export default function EditBatchPage() {
  const params = useParams()
  const router = useRouter()
  const batchId = params.id as string
  
  const [suppliers, setSuppliers] = useState(mockSuppliers)
  const [isLoading, setIsLoading] = useState(false)
  
  // Find the batch to edit
  const batch = mockBatches.find(b => b.id === batchId)
  
  if (!batch) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive">Batch Not Found</h1>
          <p className="text-muted-foreground mt-2">The batch you're looking for doesn't exist.</p>
          <Link href="/batch-intake" className="cursor-pointer">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Batches
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (formData: any) => {
    setIsLoading(true)
    
    try {
      // Mock update - in real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      toast.success('Batch updated successfully!')
      router.push('/batch-intake')
    } catch (error) {
      toast.error('Failed to update batch')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/batch-intake')
  }

  const handleSuppliersChange = (updatedSuppliers: any[]) => {
    setSuppliers(updatedSuppliers)
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
        suppliers={suppliers}
        onSuppliersChange={handleSuppliersChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEditing={true}
        isLoading={isLoading}
      />
    </div>
  )
}