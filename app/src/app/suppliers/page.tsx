'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AddSupplierDialog } from '@/modules/suppliers/components/add-supplier-dialog'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import {
    Plus,
    Search,
    Building2,
    Phone,
    Mail,
    Edit,
    Trash2,
    Package,
    Wrench
} from 'lucide-react'
import { Supplier } from '@/lib/api/suppliers-client'
import { useSuppliersQuery, useDeleteSupplierMutation } from '@/modules/suppliers/hooks/use-suppliers'

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  // Use React Query hooks for data fetching and mutations
  const { data: suppliers = [], isLoading, error, refetch } = useSuppliersQuery()
  const deleteSupplierMutation = useDeleteSupplierMutation()

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSupplierAdded = () => {
    // The mutation hook will automatically update the cache
    setEditingSupplier(null)
    setIsAddDialogOpen(false)
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplierMutation.mutateAsync(id)
        // The mutation hook will automatically update the cache
      } catch {
        // Error is handled by the mutation hook's toast
      }
    }
  }

  const getSupplierTypeIcon = (type: string) => {
    switch (type) {
      case 'devices':
        return <Package className="h-4 w-4" />
      case 'parts':
        return <Wrench className="h-4 w-4" />
      case 'both':
        return (
          <div className="flex gap-1">
            <Package className="h-3 w-3" />
            <Wrench className="h-3 w-3" />
          </div>
        )
      default:
        return null
    }
  }

  const getSupplierTypeColor = (type: string) => {
    switch (type) {
      case 'devices':
        return 'default'
      case 'parts':
        return 'secondary'
      case 'both':
        return 'outline'
      default:
        return 'outline'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner size="md" />
          <span className="ml-2">Loading suppliers...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold">Error loading suppliers</h3>
          <p className="text-sm mt-1">{error.message}</p>
          <Button onClick={() => refetch()} className="mt-2" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage device and parts suppliers</p>
        </div>
        <Button onClick={() => {
          setEditingSupplier(null)
          setIsAddDialogOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    {supplier.contact_person && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {supplier.contact_person}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={getSupplierTypeColor(supplier.supplier_type) as "default" | "secondary" | "destructive" | "outline"} className="gap-1">
                  {getSupplierTypeIcon(supplier.supplier_type)}
                  {supplier.supplier_type === 'both' ? 'Devices & Parts' : 
                   supplier.supplier_type === 'devices' ? 'Devices' : 'Parts'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {supplier.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(supplier)}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(supplier.id)}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  disabled={deleteSupplierMutation.isPending}
                >
                  {deleteSupplierMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No suppliers found</p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Supplier Dialog */}
      <AddSupplierDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSupplierAdded={handleSupplierAdded}
        editingSupplier={editingSupplier || undefined}
      />
    </div>
  )
}