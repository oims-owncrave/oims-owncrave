"use client"

import React, { createContext, useContext, Fragment, useMemo, useRef, useLayoutEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/Checkbox"
import { TableState } from "./use-table"
import {
  Table as TablePrimitive,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./table-primitives"
import { SortIndicator } from "./table-sorting"
import { TableSkeleton } from "./table-skeleton"
import { Tooltip } from "@/components/ui/Tooltip"
import { HelpCircle } from "lucide-react"

// Context
const TableContext = createContext<TableState<unknown> | null>(null)

export function useTableContext<TData>(): TableState<TData> {
  const ctx = useContext(TableContext)
  if (!ctx) throw new Error("Must be used inside <DataTable>")
  return ctx as TableState<TData>
}

// Props
interface DataTableProps<TData> {
  table: TableState<TData>
  children?: React.ReactNode
  renderExpandedRow?: (item: TData, index: number) => React.ReactNode
  className?: string
  enableSelection?: boolean
  /** Keep the header row visible while the table body scrolls vertically.
   *  Bounds the table in a scroll container (`maxHeight`) and pins `<thead>`. */
  stickyHeader?: boolean
  /** Scroll-container height when `stickyHeader` is on (default `"70vh"`). */
  maxHeight?: string
}

function getStickyClasses(isLeft: boolean, isRight: boolean) {
  if (isLeft) return "sticky z-10 bg-white dark:bg-gray-dark"
  if (isRight) return "sticky right-0 z-10 bg-white dark:bg-gray-dark"
  return ""
}

export function DataTable<TData>({ table, children, renderExpandedRow, className, enableSelection = false, stickyHeader = false, maxHeight }: DataTableProps<TData>) {
  const visibleColumns = useMemo(
    () => table.orderedColumns.filter((col) => table.columnVisibility[col.key] !== false),
    [table.orderedColumns, table.columnVisibility],
  )

  // Refs to measure actual header cell widths for accurate sticky offsets
  const headerRefs = useRef<Record<string, HTMLTableCellElement | null>>({})
  const [stickyOffsets, setStickyOffsets] = useState<Record<string, number>>({})

  // Recompute offsets after render (and on resize) whenever pinned columns or column order changes.
  useLayoutEffect(() => {
    const measure = () => {
      const offsets: Record<string, number> = {}
      let acc = 0
      for (const col of visibleColumns) {
        const isLeft = col.sticky === "left" || table.isPinned(col.key)
        if (isLeft) {
          offsets[col.key] = acc
          const el = headerRefs.current[col.key]
          acc += el ? el.getBoundingClientRect().width : (col.width ? parseInt(col.width, 10) : 150)
        }
      }
      setStickyOffsets((prev) => {
        const prevKeys = Object.keys(prev)
        const nextKeys = Object.keys(offsets)
        if (prevKeys.length === nextKeys.length && nextKeys.every((k) => prev[k] === offsets[k])) {
          return prev
        }
        return offsets
      })
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [visibleColumns, table.pinnedColumns])

  // Determine the last sticky-left column key (gets the thick right border)
  const lastStickyKey = useMemo(() => {
    let last: string | null = null
    for (const col of visibleColumns) {
      if (col.sticky === "left" || table.isPinned(col.key)) last = col.key
    }
    return last
  }, [visibleColumns, table.pinnedColumns])

  function stickyStyle(col: { key: string; sticky?: "left" | "right"; width?: string }, isPinned: boolean): React.CSSProperties {
    const isLeft = col.sticky === "left" || isPinned
    const base: React.CSSProperties = col.width ? { width: col.width } : {}
    if (isLeft) {
      return { ...base, left: stickyOffsets[col.key] ?? 0 }
    }
    if (col.sticky === "right") return base
    return base
  }

  return (
    <TableContext.Provider value={table as TableState<unknown>}>
      <div className={cn("rounded-xl border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden", className)}>
        {children}
        <TablePrimitive
          containerStyle={stickyHeader ? { maxHeight: maxHeight ?? "70vh" } : undefined}
        >
          <TableHeader>
            <TableRow className="border-none bg-gray-1 dark:bg-dark-2">
              {enableSelection && (
                <TableHead className="w-10 px-4">
                  <CheckboxAll table={table} />
                </TableHead>
              )}
              {visibleColumns.map((col) => {
                const isPinned = table.isPinned(col.key)
                const isLeft = col.sticky === "left" || isPinned
                const isRight = col.sticky === "right"
                return (
                  <TableHead
                    key={col.key}
                    ref={(el: HTMLTableCellElement | null) => { headerRefs.current[col.key] = el }}
                    className={cn(
                      "text-dark dark:text-white font-medium",
                      col.sortable !== false && "cursor-pointer select-none hover:text-primary",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      col.className,
                      getStickyClasses(isLeft, isRight),
                      isLeft && "bg-gray-1 dark:bg-dark-2",
                      col.key === lastStickyKey && "pinned-boundary",
                      stickyHeader && "sticky top-0 z-20 bg-gray-1 dark:bg-dark-2",
                    )}
                    style={stickyStyle(col, isPinned)}
                    onClick={col.sortable !== false ? (e) => table.handleSort(col.key, e.shiftKey) : undefined}
                  >
                    <span className={cn(
                      "flex items-center gap-1",
                      col.align === "center" && "justify-center",
                      col.align === "right" && "justify-end",
                    )}>
                      {col.headerTooltip && (
                        <Tooltip trigger={<HelpCircle size={13} className="cursor-help text-dark-5 dark:text-dark-6" />} align="left">
                          {col.headerTooltip}
                        </Tooltip>
                      )}
                      {col.label}
                      {col.sortable !== false && <SortIndicator columnKey={col.key} table={table as TableState<unknown>} />}
                    </span>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.isLoading ? (
              <TableSkeleton columns={visibleColumns.length + (enableSelection ? 1 : 0)} rowCount={5} />
            ) : table.processedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + (enableSelection ? 1 : 0)} className="text-center py-8 text-dark-5 dark:text-dark-6">
                  {table.searchQuery ? "Tidak ada rekaman yang cocok" : "Tidak ada data tersedia"}
                </TableCell>
              </TableRow>
            ) : (
              table.processedData.map((item, rowIndex) => {
                const rowId = table.getRowId(item, rowIndex)
                const isExpanded = table.isRowExpanded(rowId)
                const isSelected = table.selectedRowIds.has(rowId)
                return (
                  <Fragment key={rowId}>
                    <TableRow
                      className={cn(
                        "cursor-pointer",
                        enableSelection && isSelected && "bg-primary/5 dark:bg-primary/10",
                      )}
                      onClick={() => renderExpandedRow && table.toggleRowExpansion(rowId)}
                    >
                      {enableSelection && (
                        <TableCell className="w-10 px-4" onClick={(e) => { e.stopPropagation(); table.toggleRowSelection(rowId) }}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => table.toggleRowSelection(rowId)}
                            size="sm"
                          />
                        </TableCell>
                      )}
                      {visibleColumns.map((col) => {
                        const isPinned = table.isPinned(col.key)
                        const isLeft = col.sticky === "left" || isPinned
                        const isRight = col.sticky === "right"
                        return (
                          <TableCell
                            key={col.key}
                            className={cn(
                              col.align === "center" && "text-center",
                              col.align === "right" && "text-right",
                              col.className,
                              getStickyClasses(isLeft, isRight),
                              col.key === lastStickyKey && "pinned-boundary",
                            )}
                            style={stickyStyle(col, isPinned)}
                          >
                            {col.renderCell
                              ? col.renderCell(item, { rowIndex, isExpanded, isSelected })
                              : String((item as Record<string, unknown>)[col.key] ?? "")}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    {isExpanded && renderExpandedRow && (
                      <TableRow className="bg-gray-1/50 dark:bg-dark-2">
                        <TableCell colSpan={visibleColumns.length + (enableSelection ? 1 : 0)} className="p-0">
                          {renderExpandedRow(item, rowIndex)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </TablePrimitive>
      </div>
    </TableContext.Provider>
  )
}

function CheckboxAll<TData>({ table }: { table: TableState<TData> }) {
  return (
    <Checkbox
      checked={table.isAllSelected}
      indeterminate={table.isIndeterminate}
      onChange={() => table.toggleAllSelection()}
      size="sm"
    />
  )
}
