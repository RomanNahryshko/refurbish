'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { BatchForm } from '@/modules/batch-intake/components/batch-form'
import { useCreateBatch } from '@/lib/hooks/use-batches'
import { useSupabaseClient } from '@/lib/hooks/use-supabase-client'
import { BatchFormInputData } from '@/lib/types/business-types'

export default function CreateBatchPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const createBatch = useCreateBatch()
  const supabase = useSupabaseClient()

  // Get current user ID on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)
      }
    }
    getCurrentUser()
  }, [supabase])

  const handleSubmit = async (formData: BatchFormInputData) => {
    setIsLoading(true)
    
    try {
      // Validate required fields
      if (!formData.supplier_id || !formData.device_count) {
        toast.error('Please fill in all required fields')
        return
      }

      if (!currentUserId) {
        toast.error('User not authenticated')
        return
      }

      // Call the create batch mutation
      await createBatch.mutateAsync({
        supplier_id: formData.supplier_id,
        invoice_number: formData.invoice_number || undefined,
        invoice_date: formData.invoice_date || undefined,
        invoice_amount: formData.invoice_amount ? parseFloat(formData.invoice_amount) : undefined,
        device_count: parseInt(formData.device_count),
        received_date: formData.received_date,
        notes: formData.notes || undefined,
        created_by: currentUserId
      })

      toast.success('Batch created successfully!')
      router.push('/batch-intake')
    } catch {
      toast.error('Failed to create batch')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/batch-intake')
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
          <h1 className="text-3xl font-bold">Create New Batch</h1>
          <p className="text-muted-foreground">Add a new batch of devices to the system</p>
        </div>
      </div>

      {/* Form */}
      <BatchForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEditing={false}
        isLoading={isLoading || createBatch.isPending}
      />
    </div>
  )
}