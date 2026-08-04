import { TableRow, TableCell } from "./table-primitives"
import { Skeleton } from "@/components/ui/Skeleton"

export function TableSkeleton({ columns, rowCount = 5 }: { columns: number; rowCount?: number }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
