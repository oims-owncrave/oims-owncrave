"use client"

import { cn } from "@/lib/utils"

export interface TableAction<TData = unknown> {
  icon: React.ReactNode
  onClick: (item: TData) => void
  title: string
  variant?: "default" | "danger" | "warning" | "success"
  hidden?: (item: TData) => boolean
  disabled?: (item: TData) => boolean
}

interface TableActionsProps<TData> {
  item: TData
  actions: TableAction<TData>[]
  className?: string
}

const variantClass: Record<NonNullable<TableAction["variant"]>, string> = {
  default: "text-dark-5 hover:text-primary dark:text-dark-6 dark:hover:text-primary",
  danger:  "text-dark-5 hover:text-red-500 dark:text-dark-6 dark:hover:text-red-400",
  warning: "text-dark-5 hover:text-yellow-500 dark:text-dark-6 dark:hover:text-yellow-400",
  success: "text-dark-5 hover:text-green-500 dark:text-dark-6 dark:hover:text-green-400",
}

export function TableActions<TData>({ item, actions, className }: TableActionsProps<TData>) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      {actions.map((action, i) => {
        if (action.hidden?.(item)) return null
        const isDisabled = action.disabled?.(item) ?? false
        return (
          <button
            key={i}
            title={action.title}
            disabled={isDisabled}
            onClick={(e) => { e.stopPropagation(); action.onClick(item) }}
            className={cn(
              "transition",
              variantClass[action.variant ?? "default"],
              isDisabled && "opacity-40 cursor-not-allowed",
            )}
          >
            {action.icon}
          </button>
        )
      })}
    </div>
  )
}
