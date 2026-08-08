"use client"

import React, { createContext, useContext, Fragment, useMemo, useRef, useLayoutEffect, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/Checkbox"
import { ComboSelect } from "@/components/ui/ComboSelect"
import { TableState, ColumnDef } from "./use-table"
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
import { HelpCircle, LayoutList, Table2, MoreVertical } from "lucide-react"
import { Dropdown, DropdownTrigger, DropdownContent, DropdownClose } from "@/components/ui/Dropdown"
import { TableActionsVariantContext } from "./table-actions"

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
  /** Show a leading "No." column with absolute row number (continues across pages). */
  showRowNumber?: boolean
  /** Keep the header row visible while the table body scrolls vertically.
   *  Bounds the table in a scroll container (`maxHeight`) and pins `<thead>`. */
  stickyHeader?: boolean
  /** Scroll-container height when `stickyHeader` is on (default `"70vh"`). */
  maxHeight?: string
  /** FAB (floating action button) untuk mobile mode Tabel. Render fixed bottom-right di atas bottom nav. */
  mobileFab?: React.ReactNode
}

function getStickyClasses(isLeft: boolean, isRight: boolean) {
  if (isLeft) return "sticky z-10 bg-white dark:bg-gray-dark"
  if (isRight) return "sticky right-0 z-10 bg-white dark:bg-gray-dark"
  return ""
}

function inferRole<TData>(col: ColumnDef<TData>, index: number): "title" | "highlight" | "detail" | "action" | "hide" {
  if (col.mobileRole) return col.mobileRole
  const isAction = col.sortable === false && col.align === "center" && (col.key === "id" || /aksi|action/i.test(String(col.label)))
  if (isAction) return "action"
  if (index === 0) return "title"
  if (col.align === "right") return "highlight"
  return "detail"
}

function renderVal<TData>(col: ColumnDef<TData>, item: TData, rowIndex: number, isExpanded: boolean, isSelected: boolean) {
  if (col.renderCell) {
    return col.renderCell(item, { rowIndex, isExpanded, isSelected })
  }
  return String((item as Record<string, unknown>)[col.key] ?? "")
}

function CardKebabDropdown<TData>({
  actions,
  item,
  rowIndex,
  isExpanded,
  isSelected,
}: {
  actions: { col: ColumnDef<TData> }[]
  item: TData
  rowIndex: number
  isExpanded: boolean
  isSelected: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
        <DropdownTrigger
          className="flex size-7 items-center justify-center rounded-lg text-dark-5 hover:bg-gray-1 hover:text-dark dark:text-dark-6 dark:hover:bg-dark-3 dark:hover:text-white transition-colors"
          aria-label="Aksi"
        >
          <MoreVertical size={16} />
        </DropdownTrigger>
        <DropdownContent
          align="end"
          className="bg-white dark:bg-dark-2 border border-stroke dark:border-dark-3 rounded-xl shadow-2 p-1 min-w-35"
        >
          <DropdownClose>
            <TableActionsVariantContext.Provider value="menu">
              {actions.map((a) => (
                <div key={a.col.key}>
                  {renderVal(a.col, item, rowIndex, isExpanded, isSelected)}
                </div>
              ))}
            </TableActionsVariantContext.Provider>
          </DropdownClose>
        </DropdownContent>
      </Dropdown>
    </div>
  )
}

export function DataTable<TData>({ table, children, renderExpandedRow, className, enableSelection = false, showRowNumber = false, stickyHeader = false, maxHeight, mobileFab }: DataTableProps<TData>) {
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

  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Reset scroll ke atas saat toggle mobileView (Kartu<->Tabel).
  // Root cause (terbukti via log): saat view berubah, tombol interaktif view baru
  // (kebab card, dsb) mengambil fokus → browser auto-scroll ke elemen fokus
  // (mis. scrollY 560). Reset satu kali malah terlihat "glitch" karena scroll
  // sempat lompat lalu ditarik balik.
  // Fix: kunci scroll ke 0 pada setiap scroll-event selama window singkat (250ms)
  // setelah toggle — auto-scroll dinetralkan sebelum sempat ter-paint = mulus.
  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window === "undefined") return;

    window.scrollTo(0, 0);

    let locked = true;
    const keepTop = () => {
      if (locked && window.scrollY !== 0) window.scrollTo(0, 0);
    };
    window.addEventListener("scroll", keepTop, { passive: true });

    const unlock = setTimeout(() => {
      locked = false;
      window.removeEventListener("scroll", keepTop);
    }, 250);

    return () => {
      locked = false;
      clearTimeout(unlock);
      window.removeEventListener("scroll", keepTop);
    };
  }, [table.mobileView]);

  return (
    <TableContext.Provider value={table as TableState<unknown>}>
      <div ref={containerRef} className={cn("rounded-xl border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden", className)}>
        {/* ── Mobile-only UI: Toggle Kartu/Tabel (sm:hidden, di atas search/toolbar) ── */}
        <div className="sm:hidden">
          <div className="flex items-center gap-1 p-3 pb-3">
            <button
              onClick={() => table.setMobileView("card")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition",
                table.mobileView === "card"
                  ? "border border-primary bg-primary/5 text-primary shadow-sm dark:bg-primary/10"
                  : "border border-dark-7 text-dark-5 dark:text-dark-6 hover:bg-gray-1 dark:hover:bg-dark-3"
              )}
            >
              <LayoutList size={15} />
              Kartu
            </button>
            <button
              onClick={() => table.setMobileView("table")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition",
                table.mobileView === "table"
                  ? "border border-primary bg-primary/5 text-primary shadow-sm dark:bg-primary/10"
                  : "border border-dark-7 text-dark-5 dark:text-dark-6 hover:bg-gray-1 dark:hover:bg-dark-3"
              )}
            >
              <Table2 size={15} />
              Tabel
            </button>
          </div>
        </div>

        {children}

          {/* Sort Dropdown — hanya saat card view */}
          {/* {table.mobileView === "card" && (() => {
            const sortableCols = table.orderedColumns.filter(
              (col) => col.sortable !== false && col.mobileRole !== "action" && col.mobileRole !== "hide"
            )
            if (sortableCols.length === 0) return null
            const currentKey = table.sortChain[0]?.key ?? sortableCols[0]?.key ?? ""
            const currentDir = table.sortChain[0]?.direction ?? "asc"
            const selectVal = `${currentKey}:${currentDir}`
            const sortOptions = sortableCols.flatMap((col) => {
              const label = typeof col.label === "string" ? col.label : col.key
              return [
                { value: `${col.key}:asc`, label: `${label} ↑` },
                { value: `${col.key}:desc`, label: `${label} ↓` },
              ]
            })
            return (
              <div className="flex items-center gap-2 px-3 pt-2">
                <span className="text-xs text-dark-5 dark:text-dark-6 shrink-0">Urutkan</span>
                <ComboSelect
                  variant="filter"
                  searchable={false}
                  options={sortOptions}
                  value={selectVal}
                  onChange={(v) => {
                    const [key, dir] = String(v ?? "").split(":")
                    if (key) table.setSortDirect(key, (dir as "asc" | "desc") ?? "asc")
                  }}
                  className="flex-1"
                />
              </div>
            )
          })()} */}
        {/* ── End Mobile-only UI ────────────────────────────────────────── */}

        {/* Mobile Card View (< 640px, only when mobileView === "card") */}
        {table.mobileView === "card" && (
          table.isLoading ? (
          <div className="sm:hidden space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark space-y-3">
                <div className="h-5 w-1/2 rounded bg-gray-2 dark:bg-dark-2" />
                <div className="space-y-2 pt-2 border-t border-stroke dark:border-dark-3">
                  <div className="h-4 w-3/4 rounded bg-gray-2 dark:bg-dark-2" />
                  <div className="h-4 w-2/3 rounded bg-gray-2 dark:bg-dark-2" />
                </div>
              </div>
            ))}
          </div>
        ) : table.processedData.length === 0 ? (
          <div className="sm:hidden p-8 text-center text-dark-5 dark:text-dark-6 text-sm">
            {table.searchQuery ? "Tidak ada rekaman yang cocok" : "Tidak ada data tersedia"}
          </div>
        ) : (
          <div className="sm:hidden space-y-3 p-4">
            {table.processedData.map((item, rowIndex) => {
              const rowId = table.getRowId(item, rowIndex)
              const isExpanded = table.isRowExpanded(rowId)
              const isSelected = table.selectedRowIds.has(rowId)

              const roles = visibleColumns
                .map((c, idx) => ({ col: c, role: inferRole(c, idx) }))
                .filter((r) => r.role !== "hide")

              const title = roles.find((r) => r.role === "title") ?? roles[0]
              const highlights = roles.filter((r) => r.role === "highlight" && r.col.key !== title?.col.key)
              const details = roles.filter((r) => r.role === "detail" && r.col.key !== title?.col.key)
              const actions = roles.filter((r) => r.role === "action")

              return (
                <div
                  key={rowId}
                  className={cn(
                    "rounded-xl border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark transition-colors",
                    enableSelection && isSelected && "border-primary/50 bg-primary/5 dark:bg-primary/10",
                    renderExpandedRow && "cursor-pointer"
                  )}
                  onClick={() => renderExpandedRow && table.toggleRowExpansion(rowId)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {enableSelection && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => table.toggleRowSelection(rowId)}
                            size="sm"
                          />
                        </div>
                      )}
                      {showRowNumber && (
                        <span className="text-xs font-semibold text-dark-5 dark:text-dark-6">
                          #{table.pageStartIndex + rowIndex}
                        </span>
                      )}
                      {title && (
                        <div className="min-w-0 font-semibold text-dark dark:text-white truncate">
                          {renderVal(title.col, item, rowIndex, isExpanded, isSelected)}
                        </div>
                      )}
                    </div>
                    {(highlights.length > 0 || actions.length > 0) && (
                      <div className="flex shrink-0 items-center gap-2">
                        {highlights.map((h) => (
                          <div
                            key={h.col.key}
                            className="rounded-md bg-gray-1 dark:bg-dark-2 px-2 py-1 text-sm font-medium text-dark dark:text-white"
                          >
                            {renderVal(h.col, item, rowIndex, isExpanded, isSelected)}
                          </div>
                        ))}
                        {actions.length > 0 && (
                          <CardKebabDropdown
                            actions={actions}
                            item={item}
                            rowIndex={rowIndex}
                            isExpanded={isExpanded}
                            isSelected={isSelected}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {details.length > 0 && (
                    <dl className="mt-3 space-y-2 border-t border-stroke/60 pt-3 dark:border-dark-3/60">
                      {details.map((d) => (
                        <div key={d.col.key} className="flex items-center justify-between gap-2 text-sm">
                          <dt className="text-dark-5 dark:text-dark-6 shrink-0">{d.col.label}</dt>
                          <dd className="text-right text-dark dark:text-white font-medium min-w-0 truncate">
                            {renderVal(d.col, item, rowIndex, isExpanded, isSelected)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {isExpanded && renderExpandedRow && (
                    <div className="mt-3 border-t border-stroke pt-3 dark:border-dark-3">
                      {renderExpandedRow(item, rowIndex)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Desktop Table View (≥ 640px always, or when mobileView === "table" on mobile) */}
        <div className={cn(table.mobileView === "card" ? "hidden sm:block" : "block overflow-x-auto mt-5 sm:mt-0")}>
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
                {showRowNumber && (
                  <TableHead className="w-14 px-4 text-center text-dark dark:text-white font-medium">
                    No.
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
                  <TableCell colSpan={visibleColumns.length + (enableSelection ? 1 : 0) + (showRowNumber ? 1 : 0)} className="text-center py-8 text-dark-5 dark:text-dark-6">
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
                        {showRowNumber && (
                          <TableCell className="w-14 px-4 text-center text-dark-5 dark:text-dark-6">
                            {table.pageStartIndex + rowIndex}
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
                          <TableCell colSpan={visibleColumns.length + (enableSelection ? 1 : 0) + (showRowNumber ? 1 : 0)} className="p-0">
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

        {/* FAB — hanya mobile (tampilan kartu maupun tabel) */}
        {mobileFab && (
          <div className="sm:hidden fixed bottom-20 right-4 z-40">
            {mobileFab}
          </div>
        )}
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
