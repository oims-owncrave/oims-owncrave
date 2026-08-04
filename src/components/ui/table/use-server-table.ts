"use client"

import { useState, useCallback } from "react"
import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query"

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PagedResult<TItem> {
  items: TItem[]
  meta: PaginationMeta
}

export interface ServerTableFilters {
  page: number
  limit: number
  [key: string]: unknown
}

export interface UseServerTableOptions<TItem, TFilters extends ServerTableFilters> {
  queryKey: unknown[]
  fetcher: (filters: TFilters) => Promise<PagedResult<TItem>>
  initialFilters: TFilters
}

export interface UseServerTableReturn<TItem, TFilters extends ServerTableFilters> {
  /** Current page rows — pass as `data` to useTable */
  data: TItem[]
  /** For useTable: manualPagination=true, pageCount, rowCount */
  manualProps: {
    manualPagination: true
    pageCount: number
    rowCount: number
  }
  filters: TFilters
  setFilters: (patch: Partial<Omit<TFilters, "page">>) => void
  page: number
  setPage: (page: number) => void
  limit: number
  setLimit: (limit: number) => void
  meta: PaginationMeta | undefined
  isLoading: boolean
  isFetching: boolean
  invalidate: () => void
}

/**
 * Reusable hook for server-side paginated tables. Wraps useQuery + keepPreviousData
 * and exposes filter/page state. Returns `manualProps` ready to spread into useTable.
 *
 * Usage:
 *   const server = useServerTable({ queryKey: ['etf-prices'], fetcher, initialFilters })
 *   const table = useTable({ data: server.data, columns, ...server.manualProps })
 */
export function useServerTable<TItem, TFilters extends ServerTableFilters>({
  queryKey,
  fetcher,
  initialFilters,
}: UseServerTableOptions<TItem, TFilters>): UseServerTableReturn<TItem, TFilters> {
  const queryClient = useQueryClient()
  const [filters, setFiltersState] = useState<TFilters>(initialFilters)

  const query = useQuery({
    queryKey: [...queryKey, filters],
    queryFn: () => fetcher(filters),
    placeholderData: keepPreviousData,
  })

  const setFilters = useCallback((patch: Partial<Omit<TFilters, "page">>) => {
    setFiltersState((prev) => ({ ...prev, ...patch, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setFiltersState((prev) => ({ ...prev, limit, page: 1 }))
  }, [])

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  const meta = query.data?.meta
  const data = query.data?.items ?? []

  return {
    data,
    manualProps: {
      manualPagination: true,
      pageCount: meta?.totalPages ?? 1,
      rowCount: meta?.total ?? 0,
    },
    filters,
    setFilters,
    page: filters.page,
    setPage,
    limit: filters.limit,
    setLimit,
    meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    invalidate,
  }
}
