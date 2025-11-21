'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Textarea } from '@/components/ui/textarea'
import { CheckIcon, Plus, Trash2 } from 'lucide-react'
import { AddSupplierDialog } from '@/modules/suppliers/components/add-supplier-dialog'
import { toast } from 'sonner'
import { useSuppliers } from '@/lib/hooks/use-suppliers'
import { useDeleteSupplierMutation } from '@/modules/suppliers/hooks/use-suppliers'
import { Supplier } from '@/lib/api/suppliers-client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)

  // Get device suppliers from API
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers()
  const deleteSupplierMutation = useDeleteSupplierMutation()

  const handleSupplierAdded = (newSupplier: Supplier) => {
    // Auto-select the newly added supplier if it's a device supplier
    if (newSupplier.supplier_type === 'devices' || newSupplier.supplier_type === 'both') {
      setFormData(prev => ({...prev, supplier_id: newSupplier.id}))
    }
  }

  const handleDeleteClick = (e: React.MouseEvent | React.PointerEvent, supplier: Supplier) => {
    e.stopPropagation()
    e.preventDefault()
    setSupplierToDelete(supplier)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return

    try {
      await deleteSupplierMutation.mutateAsync(supplierToDelete.id)
      // Clear selection if the deleted supplier was selected
      if (formData.supplier_id === supplierToDelete.id) {
        setFormData(prev => ({...prev, supplier_id: ''}))
      }
      setIsDeleteDialogOpen(false)
      setSupplierToDelete(null)
    } catch {
      // Error is already handled by the hook
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
                    setIsAddSupplierOpen(false)
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
                    <SelectPrimitive.Item 
                      key={supplier.id} 
                      value={supplier.id}
                      className="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onPointerDown={(e) => {
                        // Allow delete button clicks to work
                        const target = e.target as HTMLElement
                        if (target.closest('button')) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <span className="absolute right-2 flex size-3.5 items-center justify-center">
                        <SelectPrimitive.ItemIndicator>
                          <CheckIcon className="size-4" />
                        </SelectPrimitive.ItemIndicator>
                      </span>
                      <SelectPrimitive.ItemText>
                        <span className="flex-1 truncate">{supplier.name}</span>
                      </SelectPrimitive.ItemText>
                      <button
                        type="button"
                        className="absolute right-8 h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 shrink-0 z-10"
                        onPointerDown={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          handleDeleteClick(e, supplier)
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          handleDeleteClick(e, supplier)
                        }}
                        disabled={deleteSupplierMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </SelectPrimitive.Item>
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

      {/* Delete Supplier Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{supplierToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSupplier}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSupplierMutation.isPending}
            >
              {deleteSupplierMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}