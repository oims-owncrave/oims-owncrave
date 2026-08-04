"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableState } from "./use-table"

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total]
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total]
  return [1, "...", current - 1, current, current + 1, "...", total]
}

interface TablePaginationProps<TData> {
  table: TableState<TData>
  pageSizeOptions?: number[]
  className?: string
}

export function TablePagination<TData>({ table, pageSizeOptions = [10, 25, 50], className }: TablePaginationProps<TData>) {
  const pages = getPageNumbers(table.currentPage, table.totalPages)

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-stroke dark:border-dark-3", className)}>
      <div className="flex items-center gap-2 text-sm text-dark-5 dark:text-dark-6">
        <span>Tampilkan</span>
        <select
          value={table.pageSize}
          onChange={(e) => { table.setPageSize(Number(e.target.value)); table.setCurrentPage(1) }}
          className="rounded-lg border border-stroke bg-transparent px-2.5 py-1 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <span>entri</span>
      </div>

      <p className="text-sm text-dark-5 dark:text-dark-6">
        {table.totalEntries === 0
          ? "Tidak ada data"
          : `Menampilkan ${table.pageStartIndex} hingga ${table.pageEndIndex} dari ${table.totalEntries} entri`}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => table.setCurrentPage(table.currentPage - 1)}
          disabled={table.currentPage === 1}
          suppressHydrationWarning
          className="flex size-9 items-center justify-center rounded-lg border border-stroke text-sm text-dark transition hover:bg-primary hover:text-white hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed dark:border-dark-3 dark:text-white dark:hover:border-primary"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((page, i) =>
          page === "..." ? (
            <span key={`ellipsis-${i}`} className="flex size-9 items-center justify-center text-sm text-dark-5 dark:text-dark-6">…</span>
          ) : (
            <button
              key={page}
              onClick={() => table.setCurrentPage(page as number)}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border text-sm transition",
                page === table.currentPage
                  ? "bg-primary border-primary text-white"
                  : "border-stroke text-dark hover:bg-primary hover:text-white hover:border-primary dark:border-dark-3 dark:text-white dark:hover:border-primary"
              )}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => table.setCurrentPage(table.currentPage + 1)}
          disabled={table.currentPage === table.totalPages}
          suppressHydrationWarning
          className="flex size-9 items-center justify-center rounded-lg border border-stroke text-sm text-dark transition hover:bg-primary hover:text-white hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed dark:border-dark-3 dark:text-white dark:hover:border-primary"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
