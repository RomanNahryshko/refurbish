'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { CompatibleModelsInput } from './compatible-models-input'
import { useCreatePartMutation, useUpdatePartMutation, useNextSkuQuery } from '@/modules/inventory/hooks/use-inventory'
import { usePartsSuppliers } from '@/modules/suppliers/hooks/use-suppliers'
import { PART_CATEGORY_LABELS } from '@/lib/constants'
import { SparePart } from '@/lib/types/business-types'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { AddSupplierDialog } from '@/modules/suppliers/components/add-supplier-dialog'
import { Supplier } from '@/lib/api/suppliers-client'

interface PartFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPart?: SparePart | null
}

interface FormData {
  sku: string
  name: string
  description: string
  category: string
  compatible_models: string[]
  minimum_stock_level: string
  unit_cost: string
  primary_supplier_id: string
}

export function PartFormDialog({ open, onOpenChange, editingPart }: PartFormDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    sku: '',
    name: '',
    description: '',
    category: '',
    compatible_models: [],
    minimum_stock_level: '',
    unit_cost: '',
    primary_supplier_id: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)
  // Hooks for data fetching and mutations
  const { data: nextSku, isLoading: skuLoading } = useNextSkuQuery()
  const { data: suppliers, isLoading: suppliersLoading, error: _suppliersError } = usePartsSuppliers()
  
  const createPartMutation = useCreatePartMutation()
  const updatePartMutation = useUpdatePartMutation()

  const isEditing = !!editingPart
  const isLoading = skuLoading || suppliersLoading

  // Reset form when dialog opens/closes or editing part changes
  useEffect(() => {
    if (open && !isEditing && nextSku) {
      // New part - use auto-generated SKU
      setFormData(prev => ({
        ...prev,
        sku: nextSku,
        compatible_models: [], // Ensure this is explicitly set
      }))
    } else if (open && isEditing && editingPart) {
      // Editing existing part - populate form
      setFormData({
        sku: editingPart.sku,
        name: editingPart.name,
        description: editingPart.description || '',
        category: editingPart.category || '',
        compatible_models: editingPart.compatible_models || [],
        minimum_stock_level: editingPart.minimum_stock_level?.toString() || '',
        unit_cost: editingPart.unit_cost?.toString() || '',
        primary_supplier_id: editingPart.primary_supplier_id || '',
      })
    } else if (!open) {
      // Reset form when dialog closes
      resetForm()
    }
  }, [open, isEditing, editingPart, nextSku])

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: '',
      compatible_models: [],
      minimum_stock_level: '',
      unit_cost: '',
      primary_supplier_id: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Part name is required')
      return
    }

    if (!formData.sku.trim()) {
      toast.error('SKU is required')
      return
    }

    setIsSubmitting(true)

    try {
      let parsedUnitCost: number | undefined
      if (formData.unit_cost && formData.unit_cost.trim() !== '') {
        // Use Number() instead of parseFloat for better precision handling
        const numValue = Number(formData.unit_cost)
        if (!isNaN(numValue) && isFinite(numValue)) {
          // Round to 2 decimal places to match database DECIMAL(10,2)
          parsedUnitCost = Math.round(numValue * 100) / 100
        }
      }
      
      // Filter out empty models from compatible_models
      const validCompatibleModels = formData.compatible_models 
        ? formData.compatible_models.filter(model => model && model.trim() !== '')
        : []
      
      const partData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category || undefined,
        compatible_models: validCompatibleModels,
        minimum_stock_level: formData.minimum_stock_level ? parseInt(formData.minimum_stock_level, 10) : undefined,
        unit_cost: parsedUnitCost,
        primary_supplier_id: formData.primary_supplier_id || undefined,
      }

      if (isEditing && editingPart) {
        await updatePartMutation.mutateAsync({
          id: editingPart.id,
          partData,
        })
      } else {
        await createPartMutation.mutateAsync(partData)
      }

      onOpenChange(false)
      resetForm()
    } catch {
      // Error is handled by the mutation hook's toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
      resetForm()
    }
  }

  const handleSupplierAdded = (newSupplier: Supplier) => {
    setFormData({...formData, primary_supplier_id: newSupplier.id})
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Spare Part' : 'Add New Spare Part'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the spare part details below'
              : 'Enter the details for the new spare part'
            }
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* SKU */}
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  placeholder="Auto-generated SKU"
                  required
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {isEditing ? 'Edit the SKU if needed' : 'Auto-generated, but can be modified'}
                </p>
              </div>
              
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Part Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., iPhone 12 Pro Screen Assembly"
                  required
                />
              </div>
              
              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Optional description or notes about this part"
                  rows={2}
                />
              </div>
              
              {/* Category */}
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PART_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Compatible Models */}
              <div className="grid gap-2">
                <Label>Compatible Models</Label>
                <CompatibleModelsInput
                  value={formData.compatible_models}
                  onChange={(models) => {
                    setFormData({...formData, compatible_models: models})
                  }}
                  placeholder="e.g., iPhone 12, iPhone 12 Pro"
                />
              </div>
              
              {/* Stock Level and Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="min_stock">Minimum Stock Level</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    min="0"
                    value={formData.minimum_stock_level}
                    onChange={(e) => setFormData({...formData, minimum_stock_level: e.target.value})}
                    placeholder="10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit_cost">Unit Cost ($)</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    pattern="[0-9]*\.?[0-9]{0,2}"
                    value={formData.unit_cost}
                    onChange={(e) => {
                      const value = e.target.value
                      // Ensure the value is properly formatted for decimal input
                      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                        setFormData({...formData, unit_cost: value})
                      }
                    }}
                    onBlur={(e) => {
                      // Format the value on blur to ensure proper decimal format
                      const value = e.target.value
                      if (value && !isNaN(Number(value))) {
                        const formatted = Number(value).toFixed(2)
                        setFormData({...formData, unit_cost: formatted})
                      }
                    }}
                    placeholder="25.99"
                  />
                </div>
              </div>
              
              {/* Supplier */}
              <div className="grid gap-2">
                <Label htmlFor="supplier">Primary Supplier</Label>
                <Select 
                  value={formData.primary_supplier_id} 
                  onValueChange={(value) => {
                    if (value === 'add-new-supplier') {
                      setIsAddSupplierOpen(true)
                    } else {
                      setFormData({...formData, primary_supplier_id: value})
                    }
                  }}
                >
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="add-new-supplier" className="text-primary font-medium">
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Supplier...
                    </div>
                  </SelectItem>
                    {suppliersLoading ? (
                      <SelectItem value="__loading__" disabled>Loading suppliers...</SelectItem>
                    ) : _suppliersError ? (
                      <SelectItem value="__error__" disabled>Error loading suppliers</SelectItem>
                    ) : suppliers && suppliers.length > 0 ? (
                      suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__no_suppliers__" disabled>No suppliers available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {_suppliersError && (
                  <p className="text-sm text-red-600">Error: {_suppliersError.message}</p>
                )}
                {suppliers && suppliers.length === 0 && !suppliersLoading && (
                  <p className="text-sm text-gray-600">No suppliers found. Please add suppliers first.</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.name.trim() || !formData.sku.trim()}
              >
                {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                {isEditing ? 'Update Part' : 'Create Part'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
      <AddSupplierDialog
        open={isAddSupplierOpen}
        onOpenChange={setIsAddSupplierOpen}
        onSupplierAdded={handleSupplierAdded}
      />
    </Dialog>
  );
}
