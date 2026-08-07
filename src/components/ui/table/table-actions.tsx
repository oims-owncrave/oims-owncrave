"use client"

import { createContext, useContext } from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/Spinner"

export const TableActionsVariantContext = createContext<"row" | "menu">("row")

export interface TableAction<TData = unknown> {
  icon: React.ReactNode
  onClick: (item: TData) => void
  title: string
  variant?: "default" | "danger" | "warning" | "success"
  hidden?: (item: TData) => boolean
  disabled?: (item: TData) => boolean
  /** Show a spinner instead of the icon while this action is pending for the row. */
  loading?: (item: TData) => boolean
}

interface TableActionsProps<TData> {
  item: TData
  actions: TableAction<TData>[]
  variant?: "row" | "menu"
  className?: string
}

const variantClass: Record<NonNullable<TableAction["variant"]>, string> = {
  default: "text-dark-5 hover:text-primary dark:text-dark-6 dark:hover:text-primary",
  danger:  "text-dark-5 hover:text-red-500 dark:text-dark-6 dark:hover:text-red-400",
  warning: "text-dark-5 hover:text-yellow-500 dark:text-dark-6 dark:hover:text-yellow-400",
  success: "text-dark-5 hover:text-green-500 dark:text-dark-6 dark:hover:text-green-400",
}

export function TableActions<TData>({ item, actions, variant: variantProp, className }: TableActionsProps<TData>) {
  const contextVariant = useContext(TableActionsVariantContext)
  const variant = variantProp ?? contextVariant

  if (variant === "menu") {
    return (
      <div className={cn("flex flex-col py-0.5 min-w-[130px]", className)}>
        {actions.map((action, i) => {
          if (action.hidden?.(item)) return null
          const isLoading = action.loading?.(item) ?? false
          const isDisabled = (action.disabled?.(item) ?? false) || isLoading
          return (
            <button
              key={i}
              type="button"
              disabled={isDisabled}
              onClick={(e) => {
                e.stopPropagation()
                action.onClick(item)
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium transition cursor-pointer text-left rounded-md hover:bg-gray-1 dark:hover:bg-dark-3",
                variantClass[action.variant ?? "default"],
                isDisabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {isLoading ? <Spinner size={16} /> : action.icon}
              <span>{action.title}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      {actions.map((action, i) => {
        if (action.hidden?.(item)) return null
        const isLoading = action.loading?.(item) ?? false
        const isDisabled = (action.disabled?.(item) ?? false) || isLoading
        return (
          <button
            key={i}
            title={action.title}
            disabled={isDisabled}
            onClick={(e) => { e.stopPropagation(); action.onClick(item) }}
            className={cn(
              "transition cursor-pointer",
              variantClass[action.variant ?? "default"],
              isDisabled && "opacity-40 cursor-not-allowed",
            )}
          >
            {isLoading ? <Spinner size={16} /> : action.icon}
          </button>
        )
      })}
    </div>
  )
}
