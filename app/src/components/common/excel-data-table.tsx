'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Download,
    FileSpreadsheet
} from 'lucide-react'

interface ExcelDataTableProps {
  data: {
    headers: string[]
    rows: Record<string, unknown>[]
    totalRows: number
    sheetName: string
  }
  onRowSelect?: (selectedRows: Record<string, unknown>[]) => void
  selectable?: boolean
}

export function ExcelDataTable({ data, onRowSelect, selectable = false }: ExcelDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const rowsPerPage = 10

  // Filter rows based on search term
  const filteredRows = data.rows.filter(row => {
    if (!searchTerm) return true
    return Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentRows = filteredRows.slice(startIndex, endIndex)

  // Handle row selection
  const handleRowSelect = (rowIndex: number) => {
    if (!selectable) return

    const actualRowIndex = startIndex + rowIndex
    setSelectedRows(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(actualRowIndex)) {
        newSelected.delete(actualRowIndex)
      } else {
        newSelected.add(actualRowIndex)
      }
      return newSelected
    })

    // Notify parent component
    if (onRowSelect) {
      const selectedData = Array.from(selectedRows).map(index => data.rows[index])
      onRowSelect(selectedData)
    }
  }

  // Handle select all
  const handleSelectAll = () => {
    if (!selectable) return

    const allCurrentIndices = currentRows.map((_, index) => startIndex + index)
    setSelectedRows(prev => {
      const newSelected = new Set(prev)
      const allSelected = allCurrentIndices.every(index => newSelected.has(index))
      
      if (allSelected) {
        allCurrentIndices.forEach(index => newSelected.delete(index))
      } else {
        allCurrentIndices.forEach(index => newSelected.add(index))
      }
      return newSelected
    })
  }

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      data.headers.join(','),
      ...data.rows.map(row => 
        data.headers.map(header => {
          const value = row[header] || ''
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.sheetName}_export.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Excel Data Preview
            </CardTitle>
            <CardDescription>
              Sheet: {data.sheetName} • {data.totalRows} total rows
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              {filteredRows.length} filtered rows
            </Badge>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={currentRows.length > 0 && currentRows.every((_, index) => 
                        selectedRows.has(startIndex + index)
                      )}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                )}
                {data.headers.map((header, index) => (
                  <TableHead key={index} className="font-medium">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRows.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex}
                  className={selectable ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => handleRowSelect(rowIndex)}
                >
                  {selectable && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(startIndex + rowIndex)}
                        onChange={() => handleRowSelect(rowIndex)}
                        className="rounded"
                      />
                    </TableCell>
                  )}
                  {data.headers.map((header, colIndex) => (
                    <TableCell key={colIndex} className="max-w-[200px]">
                      <div className="truncate" title={String(row[header])}>
                        {String(row[header])}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredRows.length)} of {filteredRows.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
