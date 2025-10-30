'use client'

import { TableRow, TableCell } from '@/components/ui/Table'

export function CallTableRowSkeleton() {
  return (
    <TableRow className="animate-pulse">
      <TableCell>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </TableCell>
      <TableCell>
        <div className="h-4 bg-gray-200 rounded w-28"></div>
      </TableCell>
      <TableCell>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </TableCell>
      <TableCell>
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </TableCell>
      <TableCell>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </TableCell>
      <TableCell>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded w-8"></div>
          <div className="h-8 bg-gray-200 rounded w-8"></div>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function CallTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <CallTableRowSkeleton key={index} />
      ))}
    </>
  )
}