"use client"

import { useState, useMemo, useEffect, useCallback } from "react"

export interface ColumnDef<TData> {
  key: (keyof TData & string) | (string & {})
  label: React.ReactNode
  sortable?: boolean          // default: true
  searchable?: boolean        // default: true
  defaultVisible?: boolean    // default: true
  align?: "left" | "center" | "right"
  width?: string
  renderCell?: (item: TData, meta: CellMeta) => React.ReactNode
  className?: string
  hideable?: boolean
  sticky?: "left" | "right"
  /** Tooltip text shown on hover over the column header label (abbreviation glossary, etc). */
  headerTooltip?: string
}

export interface CellMeta {
  rowIndex: number
  isExpanded: boolean
  isSelected: boolean
}

export interface SortEntry {
  key: string
  direction: "asc" | "desc"
}

export type SortChain = SortEntry[]  // index 0 = highest priority

export interface UseTableOptions<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  defaultSort?: { key: string; direction: "asc" | "desc" }
  defaultPageSize?: number    // default: 10
  getRowId?: (item: TData, index: number) => string | number
  isLoading?: boolean
  defaultPinned?: string[]
  /** Server-side / manual pagination mode. When true, skip in-memory filter/sort/slice.
   *  `data` is treated as the current page; pagination state is controlled externally
   *  via `pageCount` and `rowCount`. Use with useServerTable. */
  manualPagination?: boolean
  /** Total pages from server (required when manualPagination=true). */
  pageCount?: number
  /** Total row count from server (required when manualPagination=true). */
  rowCount?: number
}

export interface TableState<TData> {
  // Raw
  data: TData[]
  columns: ColumnDef<TData>[]

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Sort
  sortChain: SortChain
  handleSort: (key: string, isShiftKey: boolean) => void
  getSortEntry: (key: string) => SortEntry | undefined
  getSortPriority: (key: string) => number | undefined  // 1-based

  // Pagination
  currentPage: number
  pageSize: number
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  totalPages: number
  totalEntries: number
  pageStartIndex: number  // 1-based
  pageEndIndex: number    // 1-based

  // Column visibility
  columnVisibility: Record<string, boolean>
  toggleColumnVisibility: (key: string) => void
  setAllColumnVisibility: (visible: boolean) => void

  // Pin (user-controlled sticky left)
  pinnedColumns: Set<string>
  togglePin: (key: string) => void
  isPinned: (key: string) => boolean
  orderedColumns: ColumnDef<TData>[]

  // Expandable rows (single at a time)
  expandedRowId: string | number | null
  toggleRowExpansion: (rowId: string | number) => void
  isRowExpanded: (rowId: string | number) => boolean

  // Row selection
  selectedRowIds: Set<string | number>
  toggleRowSelection: (rowId: string | number) => void
  toggleAllSelection: () => void
  isAllSelected: boolean
  isIndeterminate: boolean
  clearSelection: () => void

  // Derived current page data
  processedData: TData[]

  // Row identity
  getRowId: (item: TData, index: number) => string | number

  // Loading
  isLoading: boolean
}

export function useTable<TData>(options: UseTableOptions<TData>): TableState<TData> {
  const { data, columns, defaultSort, defaultPageSize = 10, getRowId: getRowIdProp, isLoading = false, defaultPinned, manualPagination = false, pageCount: pageCountProp, rowCount: rowCountProp } = options

  const [searchQuery, setSearchQuery] = useState("")
  const [sortChain, setSortChain] = useState<SortChain>(
    defaultSort ? [{ key: defaultSort.key, direction: defaultSort.direction }] : []
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(columns.map((c) => [c.key, c.defaultVisible ?? true]))
  )
  const [expandedRowId, setExpandedRowId] = useState<string | number | null>(null)
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string | number>>(new Set())
  const [pinnedColumns, setPinnedColumns] = useState<Set<string>>(
    new Set(defaultPinned ?? [])
  )

  const getRowId = useCallback(
    (item: TData, index: number): string | number =>
      getRowIdProp ? getRowIdProp(item, index) : ((item as Record<string, unknown>).id as string | number) ?? index,
    [getRowIdProp]
  )

  // Pipeline — skipped in manual mode (server handles filter/sort/slice)
  const filteredData = useMemo(() => {
    if (manualPagination) return data
    if (!searchQuery.trim()) return data
    const q = searchQuery.toLowerCase()
    return data.filter((item) =>
      columns.some((col) => {
        if (col.searchable === false) return false
        const val = (item as Record<string, unknown>)[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      })
    )
  }, [data, searchQuery, columns, manualPagination])

  const sortedData = useMemo(() => {
    if (manualPagination || sortChain.length === 0) return filteredData
    return [...filteredData].sort((a, b) => {
      for (const entry of sortChain) {
        const av = (a as Record<string, unknown>)[entry.key]
        const bv = (b as Record<string, unknown>)[entry.key]
        const result = compareValues(av, bv)
        if (result !== 0) return entry.direction === "asc" ? result : -result
      }
      return 0
    })
  }, [filteredData, sortChain, manualPagination])

  const totalEntries = manualPagination ? (rowCountProp ?? 0) : sortedData.length
  const totalPages = manualPagination ? (pageCountProp ?? 1) : Math.max(1, Math.ceil(totalEntries / pageSize))
  const pageStartIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEndIndex = manualPagination
    ? Math.min(currentPage * pageSize, totalEntries)
    : Math.min(currentPage * pageSize, totalEntries)

  const processedData = useMemo(
    () => manualPagination ? data : sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedData, data, currentPage, pageSize, manualPagination]
  )

  // Resets — in manual mode page resets are driven externally (filter changes reset page via useServerTable)
  useEffect(() => { if (!manualPagination) setCurrentPage(1) }, [searchQuery, sortChain, manualPagination])
  useEffect(() => { if (!manualPagination) { setCurrentPage(1); setSelectedRowIds(new Set()) } }, [data.length, manualPagination])

  // Sort handlers
  const getSortEntry = useCallback((key: string) => sortChain.find((e) => e.key === key), [sortChain])
  const getSortPriority = useCallback(
    (key: string) => {
      const idx = sortChain.findIndex((e) => e.key === key)
      return idx === -1 ? undefined : idx + 1
    },
    [sortChain]
  )
  const handleSort = useCallback((key: string, isShiftKey: boolean) => {
    setSortChain((prev) => {
      const existing = prev.find((e) => e.key === key)
      if (!isShiftKey) {
        if (!existing) return [{ key, direction: "asc" }]
        if (existing.direction === "asc") return [{ key, direction: "desc" }]
        return []  // desc → clear
      } else {
        if (!existing) return [...prev, { key, direction: "asc" }]
        if (existing.direction === "asc") return prev.map((e) => e.key === key ? { ...e, direction: "desc" as const } : e)
        return prev.filter((e) => e.key !== key)  // desc → remove
      }
    })
  }, [])

  // Column visibility
  const toggleColumnVisibility = useCallback((key: string) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])
  const setAllColumnVisibility = useCallback((visible: boolean) => {
    setColumnVisibility((prev) => {
      const next = { ...prev }
      columns.forEach((col) => {
        if (col.hideable !== false) {
          next[col.key] = visible
        }
      })
      return next
    })
  }, [columns])

  // Pin
  const togglePin = useCallback((key: string) => {
    setPinnedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])
  const isPinned = useCallback((key: string) => pinnedColumns.has(key), [pinnedColumns])
  const orderedColumns = useMemo(() => {
    const pinned = columns.filter((col) => pinnedColumns.has(col.key))
    const rest = columns.filter((col) => !pinnedColumns.has(col.key))
    return [...pinned, ...rest]
  }, [columns, pinnedColumns])

  // Expansion
  const toggleRowExpansion = useCallback((rowId: string | number) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId))
  }, [])
  const isRowExpanded = useCallback((rowId: string | number) => expandedRowId === rowId, [expandedRowId])

  // Selection
  const isAllSelected = processedData.length > 0 && processedData.every((item, i) => selectedRowIds.has(getRowId(item, i)))
  const isIndeterminate = !isAllSelected && processedData.some((item, i) => selectedRowIds.has(getRowId(item, i)))

  const toggleRowSelection = useCallback((rowId: string | number) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev)
      if (next.has(rowId)) next.delete(rowId)
      else next.add(rowId)
      return next
    })
  }, [])
  const toggleAllSelection = useCallback(() => {
    if (isAllSelected) {
      setSelectedRowIds((prev) => {
        const next = new Set(prev)
        processedData.forEach((item, i) => next.delete(getRowId(item, i)))
        return next
      })
    } else {
      setSelectedRowIds((prev) => {
        const next = new Set(prev)
        processedData.forEach((item, i) => next.add(getRowId(item, i)))
        return next
      })
    }
  }, [isAllSelected, processedData, getRowId])
  const clearSelection = useCallback(() => setSelectedRowIds(new Set()), [])

  return {
    data, columns,
    searchQuery, setSearchQuery,
    sortChain, handleSort, getSortEntry, getSortPriority,
    currentPage, pageSize, setCurrentPage, setPageSize,
    totalPages, totalEntries, pageStartIndex, pageEndIndex,
    columnVisibility, toggleColumnVisibility, setAllColumnVisibility,
    pinnedColumns, togglePin, isPinned, orderedColumns,
    expandedRowId, toggleRowExpansion, isRowExpanded,
    selectedRowIds, toggleRowSelection, toggleAllSelection, isAllSelected, isIndeterminate, clearSelection,
    processedData,
    getRowId,
    isLoading,
  }
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === "string" && typeof b === "string") {
    if (/^\d+(\.\d+)?%$/.test(a) && /^\d+(\.\d+)?%$/.test(b)) {
      return parseFloat(a) - parseFloat(b)
    }
    return a.localeCompare(b, "id")
  }
  if (a < b) return -1
  if (a > b) return 1
  return 0
}
