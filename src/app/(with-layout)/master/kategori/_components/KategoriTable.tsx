"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pencil, Trash2 } from "lucide-react";
import { useKategoriMutation } from "@/hooks/useKategori";
import type { Kategori } from "@/db/schema";
import {
  DataTable,
  useTable,
  ColumnDef,
  TableToolbar,
  TableSearch,
  TablePagination,
  ColumnToggle,
  TableActions,
  TableAction,
} from "@/components/ui/table";

interface Props {
  data: Kategori[];
  onEdit: (item: Kategori) => void;
  onAdd: () => void;
}

export function KategoriTable({ data, onEdit, onAdd }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { remove } = useKategoriMutation();

  const actions: TableAction<Kategori>[] = [
    {
      icon: <Pencil size={16} />,
      title: "Edit",
      onClick: (item) => onEdit(item),
      variant: "default",
    },
    {
      icon: <Trash2 size={16} />,
      title: "Hapus",
      onClick: (item) => setDeleteId(item.id),
      variant: "danger",
    },
  ];

  const columns: ColumnDef<Kategori>[] = [
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama Kategori" },
    {
      key: "isActive",
      label: "Status",
      renderCell: (item) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            item.isActive
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
          )}
        >
          {item.isActive ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      key: "id",
      label: "Aksi",
      sortable: false,
      searchable: false,
      align: "center",
      renderCell: (item) => <TableActions item={item} actions={actions} />,
    },
  ];

  const table = useTable({
    data,
    columns,
    defaultPageSize: 10,
    getRowId: (item) => item.id,
  });

  return (
    <>
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <TableSearch table={table} placeholder="Cari kategori..." />
          <div className="flex items-center gap-2">
            <ColumnToggle table={table} />
            <Button onClick={onAdd}>+ Tambah Kategori</Button>
          </div>
        </TableToolbar>
        <DataTable table={table} />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Kategori?"
        message="Kategori yang sudah dipakai bahan tidak bisa dihapus — nonaktifkan saja."
        confirmLabel="Hapus"
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        loading={remove.isPending}
      />
    </>
  );
}
