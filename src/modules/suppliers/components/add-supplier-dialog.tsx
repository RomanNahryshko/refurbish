'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

type SupplierType = 'devices' | 'parts' | 'both'

interface AddSupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSupplierAdded?: (supplier: any) => void
  editingSupplier?: any
}

export function AddSupplierDialog({ 
  open, 
  onOpenChange, 
  onSupplierAdded,
  editingSupplier 
}: AddSupplierDialogProps) {
  const [formData, setFormData] = useState({
    name: editingSupplier?.name || '',
    contact_person: editingSupplier?.contact_person || '',
    email: editingSupplier?.email || '',
    phone: editingSupplier?.phone || '',
    address: editingSupplier?.address || '',
    supplier_type: (editingSupplier?.supplier_type || 'devices') as SupplierType
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.error('Supplier name is required')
      return
    }

    // Mock save - in real implementation, this would call the API
    const newSupplier = {
      id: editingSupplier?.id || `supplier-${Date.now()}`,
      ...formData,
      created_at: new Date().toISOString()
    }

    if (editingSupplier) {
      toast.success('Supplier updated successfully')
    } else {
      toast.success('Supplier added successfully')
    }

    // Notify parent component
    onSupplierAdded?.(newSupplier)
    
    // Close dialog and reset form
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      supplier_type: 'devices'
    })
  }

  const handleClose = () => {
    onOpenChange(false)
    if (!editingSupplier) {
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
          </DialogTitle>
          <DialogDescription>
            Enter the supplier details below
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter company name"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">Supplier Type *</Label>
              <Select 
                value={formData.supplier_type} 
                onValueChange={(value: SupplierType) => 
                  setFormData({...formData, supplier_type: value})
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="devices">Devices Only</SelectItem>
                  <SelectItem value="parts">Parts Only</SelectItem>
                  <SelectItem value="both">Both Devices & Parts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Person</Label>
              <Input
                id="contact"
                value={formData.contact_person}
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                placeholder="Contact person name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1234567890"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Full address"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingSupplier ? 'Update' : 'Add'} Supplier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}