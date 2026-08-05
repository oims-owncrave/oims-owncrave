"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableState } from "./use-table"

interface TableSearchProps<TData> {
  table: TableState<TData>
  placeholder?: string
  className?: string
}

export function TableSearch<TData>({ table, placeholder = "Cari...", className }: TableSearchProps<TData>) {
  return (
    <div className={cn("relative", className)}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
      <input
        type="search"
        value={table.searchQuery}
        onChange={(e) => table.setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full sm:w-64 rounded-lg border border-primary bg-transparent py-2.5 pl-10 pr-4 text-sm text-primary placeholder:text-primary outline-none transition focus:ring-1 focus:ring-primary dark:border-primary dark:bg-dark-2 dark:text-white dark:placeholder:text-primary"
      />
    </div>
  )
}
