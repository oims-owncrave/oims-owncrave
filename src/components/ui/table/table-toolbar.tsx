import { cn } from "@/lib/utils"

export function TableToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-6", className)}>
      {children}
    </div>
  )
}
