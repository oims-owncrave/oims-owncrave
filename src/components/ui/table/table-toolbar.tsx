import { cn } from "@/lib/utils"

export function TableToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6", className)}>
      {children}
    </div>
  )
}
