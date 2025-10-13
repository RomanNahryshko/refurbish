'use client';
import { useState } from 'react';
import { PartsList } from '@/modules/inventory/components/parts-list';
import { PartFormDialog } from '@/modules/inventory/components/part-form-dialog';
import { StockAdjustmentDialog } from '@/modules/inventory/components/stock-adjustment-dialog';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { SparePart } from '@/lib/types/business-types';
import { useDeletePartMutation } from '@/modules/inventory/hooks/use-inventory';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { useUser } from '@/lib/hooks/use-user';
import { useProfile } from '@/lib/hooks/use-profile-optimized';
import { LoadingSpinner } from '@/components/common/loading-spinner';

export default function InventoryPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null)
  
  const { user, isLoading: userLoading } = useUser()
  const { data: profile, isLoading: profileLoading } = useProfile(!!user)
  
  const deletePartMutation = useDeletePartMutation()

  // Only ops_manager and admin can modify inventory
  const canModify = profile?.role === 'ops_manager' || profile?.role === 'admin' || profile?.role === 'general_manager'

  // Show loading state while checking authentication and permissions
  if (userLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // If no user, don't render anything
  if (!user) {
    return null;
  }

  const handleAddPart = () => {
    setSelectedPart(null)
    setIsAddDialogOpen(true)
  }

  const handleEditPart = (part: SparePart) => {
    setSelectedPart(part)
    setIsEditDialogOpen(true)
  }

  const handleDeletePart = (part: SparePart) => {
    setSelectedPart(part)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeletePart = async () => {
    if (!selectedPart) return
    
    try {
      await deletePartMutation.mutateAsync(selectedPart.id)
      setIsDeleteDialogOpen(false)
      setSelectedPart(null)
    } catch {
      // Error is handled by the mutation hook's toast
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

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false)
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogClose}
        onConfirm={confirmDeletePart}
        title="Delete Spare Part"
        description={selectedPart 
          ? `Are you sure you want to delete "${selectedPart.name}" (${selectedPart.sku})? This action cannot be undone.`
          : "Are you sure you want to delete this spare part? This action cannot be undone."
        }
        confirmText="Delete"
        variant="destructive"
        isLoading={deletePartMutation.isPending}
      />
    </div>
  )
} 