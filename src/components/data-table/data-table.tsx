/**
 * Bảng dữ liệu dùng chung – tách từ app/tasks của template (TanStack Table v9).
 * Lọc được làm ở trang gọi (dữ liệu truyền vào đã lọc); bảng lo sắp xếp, phân trang, bấm dòng.
 */
import * as React from "react"
import { type ColumnDef, type RowData, type SortingState, flexRender, useTable } from "@tanstack/react-table"
import { dataTableFeatures, type DataTableFeatures } from "@/lib/data-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "./data-table-pagination"
import { cn } from "@/lib/utils"

export type Col<T extends RowData> = ColumnDef<DataTableFeatures, T>

export function DataTable<TData extends RowData>({ columns, data, onRowClick, pageSize = 10, empty = "Không có bản ghi khớp bộ lọc.", rowClass }: {
  columns: Col<TData>[]
  data: TData[]
  onRowClick?: (row: TData) => void
  pageSize?: number
  empty?: string
  rowClass?: (row: TData) => string | undefined
}) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    state: { sorting },
    initialState: { pagination: { pageIndex: 0, pageSize } },
    onSortingChange: setSorting,
  })
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} colSpan={h.colSpan} className="whitespace-nowrap text-xs">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} onClick={onRowClick ? () => onRowClick(row.original) : undefined} className={cn(onRowClick && "cursor-pointer", rowClass?.(row.original))}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-top">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">{empty}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {data.length > pageSize && <DataTablePagination table={table} />}
    </div>
  )
}
