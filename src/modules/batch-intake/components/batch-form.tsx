'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { AddSupplierDialog } from '@/modules/suppliers/components/add-supplier-dialog'
import { toast } from 'sonner'
import { useDeviceSuppliers } from '@/lib/hooks/use-suppliers'
import { Supplier } from '@/lib/api/suppliers-client'

interface BatchFormData {
  supplier_id: string
  invoice_number: string
  invoice_date: string
  invoice_amount: string
  device_count: string
  received_date: string
  notes: string
}

interface BatchFormProps {
  initialData?: Partial<BatchFormData>
  onSubmit: (data: BatchFormData) => void
  onCancel: () => void
  isEditing?: boolean
  isLoading?: boolean
}

export function BatchForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  isEditing = false,
  isLoading = false
}: BatchFormProps) {
  const [formData, setFormData] = useState<BatchFormData>({
    supplier_id: initialData?.supplier_id || '',
    invoice_number: initialData?.invoice_number || '',
    invoice_date: initialData?.invoice_date || '',
    invoice_amount: initialData?.invoice_amount || '',
    device_count: initialData?.device_count || '',
    received_date: initialData?.received_date || new Date().toISOString().split('T')[0],
    notes: initialData?.notes || ''
  })
  
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)

  // Get device suppliers from API
  const { data: suppliers = [], isLoading: suppliersLoading } = useDeviceSuppliers()

  const handleSupplierAdded = (newSupplier: Supplier) => {
    // Auto-select the newly added supplier if it's a device supplier
    if (newSupplier.supplier_type === 'devices' || newSupplier.supplier_type === 'both') {
      setFormData(prev => ({...prev, supplier_id: newSupplier.id}))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.supplier_id || !formData.device_count) {
      toast.error('Please fill in all required fields')
      return
    }

    onSubmit(formData)
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Batch' : 'Create New Batch'}</CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Update the batch details below' 
                : 'Enter the details for the new batch. Batch number will be auto-generated.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Supplier Selection */}
            <div className="grid gap-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select 
                value={formData.supplier_id} 
                onValueChange={(value) => {
                  if (value === 'add-new-supplier') {
                    setIsAddSupplierOpen(true)
                  } else {
                    setFormData({...formData, supplier_id: value})
                  }
                }}
                disabled={suppliersLoading}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder={suppliersLoading ? "Loading suppliers..." : "Select a supplier"} />
                </SelectTrigger>
                <SelectContent>
                  {/* Add New Supplier Option */}
                  <SelectItem value="add-new-supplier" className="text-primary font-medium">
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Supplier...
                    </div>
                  </SelectItem>
                  
                  {/* Separator */}
                  {suppliers.length > 0 && (
                    <div className="border-t my-1" />
                  )}
                  
                  {/* Existing Suppliers */}
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Device Count and Received Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="device_count">Expected Device Count *</Label>
                <Input
                  id="device_count"
                  type="number"
                  min="1"
                  placeholder="Enter number of devices"
                  value={formData.device_count}
                  onChange={(e) => setFormData({...formData, device_count: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="received_date">Received Date</Label>
                <Input
                  id="received_date"
                  type="date"
                  value={formData.received_date}
                  onChange={(e) => setFormData({...formData, received_date: e.target.value})}
                />
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invoice_number">Invoice Number</Label>
                <Input
                  id="invoice_number"
                  placeholder="INV-2024-001"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice_date">Invoice Date</Label>
                <Input
                  id="invoice_date"
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
                />
              </div>
            </div>

            {/* Invoice Amount */}
            <div className="grid gap-2">
              <Label htmlFor="invoice_amount">Invoice Amount</Label>
              <Input
                id="invoice_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.invoice_amount}
                onChange={(e) => setFormData({...formData, invoice_amount: e.target.value})}
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this batch..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Batch' : 'Create Batch')
            }
          </Button>
        </div>
      </form>

      {/* Add Supplier Dialog */}
      <AddSupplierDialog
        open={isAddSupplierOpen}
        onOpenChange={setIsAddSupplierOpen}
        onSupplierAdded={handleSupplierAdded}
      />
    </>
  )
}