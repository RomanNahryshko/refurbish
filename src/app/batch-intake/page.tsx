'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  mockBatches, 
  mockSuppliers,
  mockDevices 
} from '@/lib/mock-data'
import Link from 'next/link'
import { Plus, Search, Download, FileText, Package, Edit } from 'lucide-react'

export default function BatchIntakePage() {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredBatches = mockBatches.filter(batch =>
    batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Batch Intake</h1>
          <p className="text-muted-foreground">Manage incoming phone batches and imports</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Link href="/batch-intake/create" className="cursor-pointer">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Batch
            </Button>
          </Link>
        </div>
      </div>

      {/* Batch List - Compact Table View */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-medium">Batch Number</th>
                  <th className="p-3 text-left font-medium">Supplier</th>
                  <th className="p-3 text-left font-medium">Expected</th>
                  <th className="p-3 text-left font-medium">Imported</th>
                  <th className="p-3 text-left font-medium">Invoice</th>
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Amount</th>
                  <th className="p-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch, index) => {
                  const supplier = mockSuppliers.find(s => s.id === batch.supplier_id)
                  const importedDevicesCount = mockDevices.filter(d => d.batch_id === batch.id).length
                  const expectedCount = batch.device_count
                  const isComplete = importedDevicesCount >= expectedCount
                  const completionPercentage = Math.round((importedDevicesCount / expectedCount) * 100)
                  
                  return (
                    <tr 
                      key={batch.id} 
                      className={`border-b hover:bg-muted/50 transition-colors cursor-pointer ${
                        index % 2 === 0 ? '' : 'bg-muted/20'
                      }`}
                    >
                      <td className="p-3">
                        <Link href={`/devices?batch=${batch.id}`} className="hover:underline font-medium cursor-pointer text-primary">
                          {batch.batch_number}
                        </Link>
                      </td>
                      <td className="p-3 text-sm">{supplier?.name || 'Unknown'}</td>
                      <td className="p-3">
                        <Badge variant="outline">{expectedCount}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{importedDevicesCount}</Badge>
                      </td>
                      <td className="p-3 text-sm font-mono">{batch.invoice_number || '-'}</td>
                      <td className="p-3 text-sm">
                        {batch.received_date 
                          ? new Date(batch.received_date).toLocaleDateString() 
                          : '-'}
                      </td>
                      <td className="p-3 text-sm font-medium">
                        {batch.invoice_amount 
                          ? `$${batch.invoice_amount.toLocaleString()}` 
                          : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 flex-wrap">
                          <Link href={`/batch-intake/${batch.id}/edit`} className="cursor-pointer">
                            <Button variant="outline" size="sm" title="Edit Batch">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </Link>
                          <Link href={`/batch-intake/${batch.id}/import`} className="cursor-pointer">
                            <Button variant="outline" size="sm">
                              <Download className="h-3 w-3 mr-1" />
                              Import
                            </Button>
                          </Link>
                          <Link href={`/devices?batch=${batch.id}`} className="cursor-pointer">
                            <Button variant="outline" size="sm">
                              <Package className="h-3 w-3 mr-1" />
                              Devices
                            </Button>
                          </Link>
                          <Link href={`/batch-intake/${batch.id}/labels`} className="cursor-pointer">
                            <Button variant="outline" size="sm">
                              <FileText className="h-3 w-3 mr-1" />
                              Labels
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredBatches.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No batches found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}