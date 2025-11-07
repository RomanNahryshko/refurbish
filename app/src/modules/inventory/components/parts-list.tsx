'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { usePartsQuery } from '@/modules/inventory/hooks/use-inventory'
import { StockLevelBadge, getStockStatus } from '@/modules/inventory/components/stock-level-badge'
import { PART_CATEGORY_LABELS } from '@/lib/constants'
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  Settings,
  FileText
} from 'lucide-react'
import { SparePart } from '@/lib/types/business-types'
import Link from 'next/link'

interface PartsListProps {
  onAddPart?: () => void
  onEditPart?: (part: SparePart) => void
  onDeletePart?: (part: SparePart) => void
  onAdjustStock?: (part: SparePart) => void
  canModify?: boolean
}

export function PartsList({ 
  onAddPart, 
  onEditPart, 
  onDeletePart, 
  onAdjustStock,
  canModify = false 
}: PartsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')

  // Build filters object
  const filters = {
    ...(searchTerm && { search: searchTerm }),
    ...(categoryFilter && categoryFilter !== 'all' && { category: categoryFilter }),
    ...(stockFilter === 'low' && { low_stock: true }),
  }

  const { data: parts, isLoading, error, refetch } = usePartsQuery(
    Object.keys(filters).length > 0 ? filters : undefined
  )

  // Filter by stock status on client side if needed
  const filteredParts = parts?.filter(part => {
    if (stockFilter === 'low') return getStockStatus(part) === 'low'
    if (stockFilter === 'medium') return getStockStatus(part) === 'medium'
    if (stockFilter === 'good') return getStockStatus(part) === 'good'
    return true
  }) || []

  const handleRefresh = () => {
    refetch()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setStockFilter('all')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded">
        <h3 className="font-semibold">Error loading parts</h3>
        <p className="text-sm mt-1">{error.message}</p>
        <Button onClick={handleRefresh} className="mt-2" size="sm">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Spare Parts Inventory</h2>
          <p className="text-muted-foreground">
            Manage spare parts stock levels and details
          </p>
        </div>
        {canModify && onAddPart && (
          <Button onClick={onAddPart}>
            <Plus className="h-4 w-4 mr-2" />
            Add Part
          </Button>
        )}
      </div>

      {/* Parts Table with Integrated Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-8"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(PART_CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stock Status Filter */}
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="All Stock Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="medium">Medium Stock</SelectItem>
                <SelectItem value="good">Good Stock</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-9">
              Clear
            </Button>
          </div>

          {/* Table Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Parts ({filteredParts.length})</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Current inventory levels and part details
            </p>
          </div>
          {filteredParts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {parts?.length === 0 ? 'No parts found' : 'No parts match your filters'}
              </p>
              {parts?.length === 0 && canModify && onAddPart && (
                <Button onClick={onAddPart} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Part
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Compatible Models</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-mono text-sm">
                        {part.sku}
                      </TableCell>
                      <TableCell className="font-medium">
                        {part.name}
                        {part.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {part.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {part.category && (
                          <Badge variant="outline">
                            {PART_CATEGORY_LABELS[part.category as keyof typeof PART_CATEGORY_LABELS] || part.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <StockLevelBadge part={part} />
                      </TableCell>
                      <TableCell>
                        {part.unit_cost ? `$${part.unit_cost.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {part.suppliers?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {part.compatible_models && part.compatible_models.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {part.compatible_models.slice(0, 3).map((model, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {model}
                              </Badge>
                            ))}
                            {part.compatible_models.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{part.compatible_models.length - 3} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/inventory/ledger/${part.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              title="View Ledger"
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          </Link>
                          {canModify && (
                            <>
                              {onAdjustStock && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onAdjustStock(part)}
                                  title="Adjust Stock"
                                >
                                  <Settings className="h-3 w-3" />
                                </Button>
                              )}
                              {onEditPart && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onEditPart(part)}
                                  title="Edit Part"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                              {onDeletePart && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onDeletePart(part)}
                                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  title="Delete Part"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
