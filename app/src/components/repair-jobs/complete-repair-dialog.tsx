'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Minus, Plus, X } from 'lucide-react'
import { SparePart } from '@/lib/types/business-types'

interface PartsRecording {
  repairId: string | null
  parts: Array<{
    partId: string
    quantity: number
  }>
  notes: string
}

interface CompleteRepairDialogProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (parts: Array<{ spare_part_id: string; quantity_used: number; notes?: string }>, notes?: string) => void
  spareParts: SparePart[]
  isLoading?: boolean
}

export function CompleteRepairDialog({
  isOpen,
  onClose,
  onComplete,
  spareParts,
  isLoading = false
}: CompleteRepairDialogProps) {
  const [partsRecording, setPartsRecording] = useState<PartsRecording>({
    repairId: null,
    parts: [],
    notes: ''
  })

  const handleClose = () => {
    setPartsRecording({
      repairId: null,
      parts: [],
      notes: ''
    })
    onClose()
  }

  const handleComplete = () => {
    const partsToSubmit = partsRecording.parts.map(part => ({
      spare_part_id: part.partId,
      quantity_used: part.quantity,
      notes: undefined // Could be enhanced to allow per-part notes
    }))
    
    onComplete(partsToSubmit, partsRecording.notes)
    handleClose()
  }

  const addPart = (partId: string) => {
    if (partId && !partsRecording.parts.find(p => p.partId === partId)) {
      const newParts = [...partsRecording.parts, { partId, quantity: 1 }]
      setPartsRecording({ ...partsRecording, parts: newParts })
    }
  }

  const updatePartQuantity = (index: number, delta: number) => {
    const newParts = [...partsRecording.parts]
    const sparePart = spareParts.find(p => p.id === newParts[index].partId)
    const maxStock = sparePart?.quantity_in_stock || 0
    
    if (delta > 0 && newParts[index].quantity < maxStock) {
      newParts[index].quantity++
    } else if (delta < 0 && newParts[index].quantity > 1) {
      newParts[index].quantity--
    }
    
    setPartsRecording({ ...partsRecording, parts: newParts })
  }

  const removePart = (index: number) => {
    const newParts = partsRecording.parts.filter((_, i) => i !== index)
    setPartsRecording({ ...partsRecording, parts: newParts })
  }

  const hasInsufficientParts = partsRecording.parts.some(part => {
    const sparePart = spareParts.find(p => p.id === part.partId)
    return sparePart?.quantity_in_stock !== undefined && sparePart.quantity_in_stock < part.quantity
  })

  const availableParts = spareParts.filter(part => 
    !partsRecording.parts.find(p => p.partId === part.id)
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Complete Repair</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Parts Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Add Parts (Optional):</label>
            <Select value="" onValueChange={addPart}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select part" />
              </SelectTrigger>
              <SelectContent>
                {availableParts.map(part => (
                  <SelectItem key={part.id} value={part.id}>
                    {part.name} (Stock: {part.quantity_in_stock})
                  </SelectItem>
                ))}
                {availableParts.length === 0 && (
                  <div className="p-2 text-sm text-gray-500">All parts already added</div>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Selected Parts List */}
          {partsRecording.parts.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Selected Parts:</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {partsRecording.parts.map((part, index) => {
                  const sparePart = spareParts.find(p => p.id === part.partId)
                  const isLowStock = sparePart?.quantity_in_stock !== undefined && sparePart.quantity_in_stock < 10
                  const willGoNegative = sparePart?.quantity_in_stock !== undefined && sparePart.quantity_in_stock < part.quantity
                  
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <span className="text-sm">{sparePart?.name}</span>
                        <div className="text-xs text-gray-500">
                          Available: {sparePart?.quantity_in_stock || 0}
                          {isLowStock && <span className="text-red-500 ml-1">⚠️ Low Stock</span>}
                          {willGoNegative && <span className="text-red-600 ml-1">❌ Insufficient Stock</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updatePartQuantity(index, -1)}
                          disabled={part.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{part.quantity}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updatePartQuantity(index, 1)}
                          disabled={part.quantity >= (sparePart?.quantity_in_stock || 0)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePart(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Total parts: {partsRecording.parts.reduce((sum, p) => sum + p.quantity, 0)}
              </div>
            </div>
          )}
          
          {/* Notes Input */}
          <div>
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Input
              placeholder="Completion notes..."
              value={partsRecording.notes}
              onChange={(e) => setPartsRecording({ 
                ...partsRecording, 
                notes: e.target.value 
              })}
              className="mt-1"
            />
          </div>
          
          {/* Insufficient Stock Warning */}
          {hasInsufficientParts && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">
                Cannot complete repair: insufficient stock for selected parts
              </span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleComplete}
              className="flex-1"
              disabled={hasInsufficientParts || isLoading}
            >
              {isLoading ? 'Completing...' : `Complete Repair${partsRecording.parts.length > 0 ? ` (${partsRecording.parts.length} part${partsRecording.parts.length > 1 ? 's' : ''})` : ''}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
