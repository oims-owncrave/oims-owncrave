// Hook & types
export { useTable } from "./use-table"
export type { UseTableOptions, TableState, ColumnDef, SortEntry, SortChain, CellMeta } from "./use-table"
export { useServerTable } from "./use-server-table"
export type { UseServerTableOptions, UseServerTableReturn, ServerTableFilters, PagedResult, PaginationMeta } from "./use-server-table"

// Root component + context
export { DataTable, useTableContext } from "./table"

// Sub-components
export { TableSearch } from "./table-search"
export { TablePagination } from "./table-pagination"
export { SelectionBar } from "./table-selection"
export { ColumnToggle } from "./table-column-toggle"
export { TableToolbar } from "./table-toolbar"
export { TableSkeleton } from "./table-skeleton"
export { SortIndicator } from "./table-sorting"
export { TableActions } from "./table-actions"
export type { TableAction } from "./table-actions"

// Re-export primitives (backwards compat: @/components/ui/table still resolves here)
// Note: primitive `Table` is intentionally NOT re-exported here to avoid conflict with
// the `Table` namespace object below. Consumers that need the raw <Table> wrapper
// should import from "./table-primitives" directly.
export {
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "./table-primitives"

// Namespace object for ergonomic API: <Table.Search />, <Table.Pagination /> etc.
import { DataTable } from "./table"
import { TableToolbar } from "./table-toolbar"
import { TableSearch } from "./table-search"
import { TablePagination } from "./table-pagination"
import { SelectionBar } from "./table-selection"
import { ColumnToggle } from "./table-column-toggle"

export const Table = Object.assign(DataTable, {
  Toolbar: TableToolbar,
  Search: TableSearch,
  Pagination: TablePagination,
  SelectionBar: SelectionBar,
  ColumnToggle: ColumnToggle,
})
