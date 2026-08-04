"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableState } from "./use-table"

interface SelectionBarProps<TData> {
  table: TableState<TData>
  children?: React.ReactNode
  className?: string
}

export function SelectionBar<TData>({ table, children, className }: SelectionBarProps<TData>) {
  if (table.selectedRowIds.size === 0) return null
  return (
    <div className={cn("flex items-center justify-between gap-4 border-b border-stroke px-4 py-2.5 bg-primary/5 dark:border-dark-3", className)}>
      <span className="text-dark dark:text-white">
        {table.selectedRowIds.size} baris dipilih
      </span>
      <div className="flex items-center gap-2">
        {children}
        <button
          onClick={table.clearSelection}
          className="text-dark-5 hover:text-dark dark:text-dark-6 dark:hover:text-white transition"
          title="Clear selection"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
