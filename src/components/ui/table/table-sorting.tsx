"use client"

import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react"
import { TableState } from "./use-table"

export function SortIndicator({ columnKey, table }: { columnKey: string; table: TableState<unknown> }) {
  const entry = table.getSortEntry(columnKey)
  const priority = table.getSortPriority(columnKey)
  const showBadge = priority !== undefined && table.sortChain.length > 1

  return (
    <span className="inline-flex items-center gap-0.5">
      {!entry && <ChevronsUpDown size={14} className="text-dark-5 dark:text-dark-6" />}
      {entry?.direction === "asc" && <ChevronUp size={14} className="text-primary" />}
      {entry?.direction === "desc" && <ChevronDown size={14} className="text-primary" />}
      {showBadge && (
        <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
          {priority}
        </span>
      )}
    </span>
  )
}
