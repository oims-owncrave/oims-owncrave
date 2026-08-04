"use client"

import { useState } from "react"
import { Columns3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dropdown, DropdownTrigger, DropdownContent } from "@/components/ui/Dropdown"
import { Checkbox } from "@/components/ui/Checkbox"
import { TableState } from "./use-table"

export function ColumnToggle<TData>({ table, className }: { table: TableState<TData>; className?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  const hideableColumns = table.columns.filter((col) => col.hideable !== false)
  const hiddenCount = hideableColumns.filter((col) => table.columnVisibility[col.key] === false).length
  const pinnedCount = hideableColumns.filter((col) => table.isPinned(col.key)).length
  const total = hideableColumns.length

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger
        className={cn(
          "flex items-center gap-2 rounded-lg border border-primary hover:bg-primary/10 text-primary px-4 py-3 text-sm font-medium transition",
          className
        )}
      >
        <Columns3 size={16} />
        <span>Kolom</span>
        {(hiddenCount > 0 || pinnedCount > 0) && (
          <span className="inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {total - hiddenCount}/{total}
          </span>
        )}
      </DropdownTrigger>
      <DropdownContent align="end" className="bg-white dark:bg-dark-2 border border-stroke dark:border-dark-3 rounded-lg shadow-2 p-3 min-w-[320px]">
        <div className="mb-2 grid grid-cols-[1fr_4.5rem_4.5rem] px-2">
          <span className="text-xs font-bold text-dark-5 dark:text-dark-6 uppercase tracking-widest">Kolom</span>
          <span className="text-xs font-bold text-dark-5 dark:text-dark-6 uppercase tracking-widest text-center">Tampil</span>
          <span className="text-xs font-bold text-dark-5 dark:text-dark-6 uppercase tracking-widest text-center">Pin</span>
        </div>
        
        <div className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center rounded px-2 py-2 my-3 bg-primary/5 border border-primary/10 dark:bg-primary/10 dark:border-primary/20">
          <span className="text-sm font-semibold text-primary">Toggle Semua</span>
          <div className="flex justify-center">
            <Checkbox
              size="sm"
              checked={hiddenCount === 0}
              onChange={(checked) => table.setAllColumnVisibility(checked)}
            />
          </div>
          <div className="flex justify-center">
            <span className="text-primary/40 text-sm font-bold">-</span>
          </div>
        </div>
        {hideableColumns.map((col) => {
          const isVisible = table.columnVisibility[col.key] !== false
          const pinned = table.isPinned(col.key)
          const label = typeof col.label === "string" ? col.label : col.key
          return (
            <div
              key={col.key}
              className="grid grid-cols-[1fr_4.5rem_4.5rem] whitespace-nowrap items-center rounded px-2 py-1.5 hover:bg-gray-1 dark:hover:bg-dark-3"
            >
              <span className="text-sm text-dark dark:text-white">{label}</span>
              <div className="flex justify-center">
                <Checkbox
                  checked={isVisible}
                  onChange={() => table.toggleColumnVisibility(col.key)}
                  size="sm"
                />
              </div>
              <div className="flex justify-center">
                <Checkbox
                  checked={pinned}
                  onChange={() => table.togglePin(col.key)}
                  size="sm"
                />
              </div>
            </div>
          )
        })}
      </DropdownContent>
    </Dropdown>
  )
}
