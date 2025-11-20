'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface ReportTableProps {
  title: string
  headers: string[]
  children: React.ReactNode
}

export function ReportTable({
  title,
  headers,
  children
}: ReportTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table className="table-fixed w-full">
          <colgroup>
            <col className="w-[50%]" />
            <col className="w-[25%]" />
            <col className="w-[25%]" />
          </colgroup>
          <TableHeader>
            <TableRow>
              {headers.map((header, idx) => (
                <TableHead key={idx}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{children}</TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

