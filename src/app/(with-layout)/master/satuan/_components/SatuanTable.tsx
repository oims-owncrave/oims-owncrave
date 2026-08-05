"use client";

import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import type { Satuan } from "@/db/schema";
import {
  DataTable,
  useTable,
  ColumnDef,
  TableToolbar,
  TableSearch,
  TablePagination,
  TableActions,
  ColumnToggle,
} from "@/components/ui/table";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  data: Satuan[];
  onAdd: () => void;
  onEdit: (item: Satuan) => void;
  onDelete: (id: string) => void;
}

export function SatuanTable({ data, onAdd, onEdit, onDelete }: Props) {
  const columns: ColumnDef<Satuan>[] = [
    {
      key: "nama",
      label: "Nama Satuan",
    },
    {
      key: "singkatan",
      label: "Singkatan",
    },
    {
      key: "isActive",
      label: "Status",
      renderCell: (u) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            u.isActive
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-gray-1 text-gray-600 dark:bg-dark-3 dark:text-dark-6",
          )}
        >
          {u.isActive ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      key: "id",
      label: "Aksi",
      sortable: false,
      searchable: false,
      align: "center",
      renderCell: (u) => (
        <TableActions
          item={u}
          actions={[
            {
              title: "Edit",
              icon: <Pencil size={16} />,
              onClick: (u) => onEdit(u),
            },
            {
              title: "Hapus",
              icon: <Trash2 size={16} />,
              variant: "danger",
              onClick: (u) => onDelete(u.id),
            },
          ]}
        />
      ),
    },
  ];

  const table = useTable({
    data,
    columns,
    defaultPageSize: 10,
    getRowId: (u) => u.id,
  });

  return (
    <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
      <TableToolbar>
        <TableSearch table={table} placeholder="Cari satuan..." />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ColumnToggle table={table} className="flex-1 sm:flex-none justify-center" />
          <Button onClick={onAdd} className="flex-1 sm:flex-none">+ Tambah Satuan</Button>
        </div>
      </TableToolbar>

      <DataTable table={table} showRowNumber />

      <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
    </div>
  );
}
