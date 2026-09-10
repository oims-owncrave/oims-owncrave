"use client";

import { useState } from "react";
import { cn, formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useKemasanMutation } from "@/hooks/useKemasan";
import { KEMASAN_JENIS_LABEL } from "@/lib/qc/labels";
import type { KemasanRow } from "@/services/kemasan";
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
  data: KemasanRow[];
  onEdit: (item: KemasanRow) => void;
  onAdd: () => void;
}

export function KemasanTable({ data, onEdit, onAdd }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { remove } = useKemasanMutation();

  const actions: TableAction<KemasanRow>[] = [
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

  const columns: ColumnDef<KemasanRow>[] = [
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama Kemasan" },
    {
      key: "jenis",
      label: "Jenis",
      renderCell: (item) => KEMASAN_JENIS_LABEL[item.jenis] ?? item.jenis,
    },
    { key: "ukuran", label: "Ukuran", renderCell: (item) => item.ukuran || "—" },
    {
      key: "supplierNama",
      label: "Supplier",
      renderCell: (item) => item.supplierNama || "—",
    },
    {
      key: "biaya",
      label: "Biaya",
      align: "right",
      renderCell: (item) => formatRupiah(item.biaya),
    },
    {
      key: "stokMinimum",
      label: "Stok Min.",
      align: "right",
      renderCell: (item) =>
        Number(item.stokMinimum).toLocaleString("id-ID", { maximumFractionDigits: 2 }),
    },
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch
              table={table}
              placeholder="Cari kemasan..."
              className="flex-1 sm:w-64"
            />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onAdd} className="hidden sm:inline-flex">
              + Tambah Kemasan
            </Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          mobileFab={
            <Button
              onClick={onAdd}
              className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center"
            >
              <Plus size={24} />
            </Button>
          }
        />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Kemasan?"
        message="Kemasan yang sudah dipakai packing sebaiknya dinonaktifkan saja."
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
