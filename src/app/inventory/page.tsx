'use client'

import { useState, useEffect } from 'react'
import { PartsList } from '@/modules/inventory/components/parts-list'
import { PartFormDialog } from '@/modules/inventory/components/part-form-dialog'
import { StockAdjustmentDialog } from '@/modules/inventory/components/stock-adjustment-dialog'
import { SparePart } from '@/lib/types/business-types'
import { useDeletePartMutation } from '@/modules/inventory/hooks/use-inventory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Shield } from 'lucide-react'
import { toast } from 'sonner'

export default function InventoryPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const deletePartMutation = useDeletePartMutation()

  // Fetch user role from API
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.role || 'viewer')
        } else if (response.status === 404) {
          // No profile exists, but user is authenticated
          // They might be a superadmin - let the API handle permissions
          setUserRole('admin') // Assume admin for UI purposes
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }
    fetchUserProfile()
  }, [])

  // Only ops_manager and admin can modify inventory
  const canModify = userRole === 'ops_manager' || userRole === 'admin'

  const handleAddPart = () => {
    setSelectedPart(null)
    setIsAddDialogOpen(true)
  }

  const handleEditPart = (part: SparePart) => {
    setSelectedPart(part)
    setIsEditDialogOpen(true)
  }

  const handleDeletePart = async (partId: string) => {
    const part = selectedPart // Could also find part by ID if needed
    
    if (confirm(`Are you sure you want to delete this spare part? This action cannot be undone.`)) {
      try {
        await deletePartMutation.mutateAsync(partId)
      } catch (error) {
        // Error is handled by the mutation hook's toast
        console.error('Delete error:', error)
      }
    }
  }

  const handleAdjustStock = (part: SparePart) => {
    setSelectedPart(part)
    setIsStockDialogOpen(true)
  }

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false)
    setSelectedPart(null)
  }

  const handleStockDialogClose = () => {
    setIsStockDialogOpen(false)
    setSelectedPart(null)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Permission Info */}
      {canModify && (
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You have inventory management permissions. You can add, edit, and adjust stock levels for spare parts.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Parts List */}
      <PartsList
        onAddPart={canModify ? handleAddPart : undefined}
        onEditPart={canModify ? handleEditPart : undefined}
        onDeletePart={canModify ? handleDeletePart : undefined}
        onAdjustStock={canModify ? handleAdjustStock : undefined}
        canModify={canModify}
      />

      {/* Add Part Dialog */}
      <PartFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {/* Edit Part Dialog */}
      <PartFormDialog
        open={isEditDialogOpen}
        onOpenChange={handleEditDialogClose}
        editingPart={selectedPart}
      />

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        open={isStockDialogOpen}
        onOpenChange={handleStockDialogClose}
        part={selectedPart}
      />
    </div>
  )
} 