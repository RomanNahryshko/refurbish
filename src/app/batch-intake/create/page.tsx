'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { mockSuppliers } from '@/lib/mock-data'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { BatchForm } from '@/modules/batch-intake/components/batch-form'

export default function CreateBatchPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState(mockSuppliers)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: any) => {
    setIsLoading(true)
    
    try {
      // Mock save - in real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      toast.success('Batch created successfully!')
      router.push('/batch-intake')
    } catch (error) {
      toast.error('Failed to create batch')
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
        suppliers={suppliers}
        onSuppliersChange={handleSuppliersChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEditing={false}
        isLoading={isLoading}
      />
    </div>
  )
}