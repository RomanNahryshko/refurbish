'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { StockLevelBadge } from './stock-level-badge';
import { useAddStockMutation } from '@/modules/inventory/hooks/use-inventory';
import { SparePart } from '@/lib/types/business-types';
import { toast } from 'sonner';
import { Package, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';

interface StockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  part?: SparePart | null
}

interface FormData {
  adjustment_type: 'add' | 'remove' | 'correction' | ''
  quantity: string
  reference_number: string
  reason: string
}

export function StockAdjustmentDialog({ open, onOpenChange, part }: StockAdjustmentDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    adjustment_type: '',
    quantity: '',
    reference_number: '',
    reason: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addStockMutation = useAddStockMutation()

  // Reset form when dialog opens/closes or part changes
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setFormData({
      adjustment_type: '',
      quantity: '',
      reference_number: '',
      reason: '',
    })
  }

  const calculateNewStock = (): number | null => {
    if (!part || !formData.quantity || !formData.adjustment_type) return null

    const adjustment = parseInt(formData.quantity, 10)
    if (isNaN(adjustment)) return null

    const currentStock = part.quantity_in_stock
    
    switch (formData.adjustment_type) {
      case 'add':
        return currentStock + adjustment
      case 'remove':
        return currentStock - adjustment
      case 'correction':
        // For correction, show the exact quantity that will be sent
        return adjustment
      default:
        return null
    }
  }

  const newStockLevel = calculateNewStock()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!part) {
      toast.error('No part selected')
      return
    }

    if (!formData.adjustment_type) {
      toast.error('Please select an adjustment type')
      return
    }

    if (!formData.quantity) {
      toast.error('Please enter a quantity')
      return
    }

    const quantityValue = parseInt(formData.quantity, 10)
    if (isNaN(quantityValue)) {
      toast.error('Please enter a valid number')
      return
    }

    // For add/remove, quantity must be positive
    if (formData.adjustment_type !== 'correction' && quantityValue <= 0) {
      toast.error('Quantity must be positive for add/remove operations')
      return
    }

    // Note: API handles all validation including negative stock prevention

    setIsSubmitting(true)

    try {
      const adjustmentQuantity = parseInt(formData.quantity, 10)

      await addStockMutation.mutateAsync({
        spare_part_id: part.id,
        adjustment_type: formData.adjustment_type,
        quantity: adjustmentQuantity,
        reference_number: formData.reference_number.trim() || undefined,
        reason: formData.reason.trim() || undefined,
      })

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

  const getAdjustmentIcon = () => {
    switch (formData.adjustment_type) {
      case 'add':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'remove':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'correction':
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getAdjustmentDescription = () => {
    switch (formData.adjustment_type) {
      case 'add':
        return 'Add stock to inventory (requires invoice number)'
      case 'remove':
        return 'Remove stock from inventory'
      case 'correction':
        return 'Correct stock to exact amount'
      default:
        return 'Select adjustment type'
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Adjust Stock Level
          </DialogTitle>
          <DialogDescription>
            Modify the stock level for this spare part
          </DialogDescription>
        </DialogHeader>
        
        {!part ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No part selected</p>
          </div>
        ) : (
          <>
            {/* Current Part Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{part.name}</CardTitle>
                <CardDescription className="font-mono">{part.sku}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Stock:</span>
                  <StockLevelBadge part={part} />
                </div>
              </CardContent>
            </Card>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* Adjustment Type */}
                <div className="grid gap-2">
                  <Label htmlFor="type">Adjustment Type *</Label>
                  <Select 
                    value={formData.adjustment_type} 
                    onValueChange={(value: 'add' | 'remove' | 'correction') => 
                      setFormData({...formData, adjustment_type: value})
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select adjustment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Add Stock
                        </div>
                      </SelectItem>
                      <SelectItem value="remove">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          Remove Stock
                        </div>
                      </SelectItem>
                      <SelectItem value="correction">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="h-4 w-4 text-blue-600" />
                          Stock Correction
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.adjustment_type && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {getAdjustmentIcon()}
                      {getAdjustmentDescription()}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="grid gap-2">
                  <Label htmlFor="quantity">
                    {formData.adjustment_type === 'correction' ? 'Exact Quantity *' : 'Quantity *'}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder={formData.adjustment_type === 'correction' ? 'Enter exact quantity' : 'Amount to adjust'}
                    required
                  />
                  {newStockLevel !== null && (
                    <p className="text-xs text-green-600">
                      {formData.adjustment_type === 'correction' 
                        ? `Quantity to send: ${newStockLevel}`
                        : `New stock level will be: ${newStockLevel}`
                      }
                    </p>
                  )}
                </div>

                {/* Reference Number (required for add) */}
                <div className="grid gap-2">
                  <Label htmlFor="reference">
                    {formData.adjustment_type === 'add' ? 'Invoice/Reference Number' : 'Reference Number'}
                  </Label>
                  <Input
                    id="reference"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                    placeholder="e.g., INV-2024-001, PO-12345"
                  />
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
                  disabled={isSubmitting || !formData.adjustment_type || !formData.quantity}
                >
                  {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                  Apply Adjustment
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
