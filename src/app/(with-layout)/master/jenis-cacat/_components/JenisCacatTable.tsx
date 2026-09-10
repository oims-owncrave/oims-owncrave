"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useJenisCacatMutation } from "@/hooks/useJenisCacat";
import {
  QC_TINGKAT_LABEL,
  QC_TINGKAT_CLASS,
  CACAT_KATEGORI_LABEL,
  CACAT_SUMBER_LABEL,
} from "@/lib/qc/labels";
import type { JenisCacat } from "@/db/schema";
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
  data: JenisCacat[];
  onEdit: (item: JenisCacat) => void;
  onAdd: () => void;
}

export function JenisCacatTable({ data, onEdit, onAdd }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { remove } = useJenisCacatMutation();

  const actions: TableAction<JenisCacat>[] = [
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

  const columns: ColumnDef<JenisCacat>[] = [
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama Cacat" },
    {
      key: "kategori",
      label: "Kategori",
      renderCell: (item) => CACAT_KATEGORI_LABEL[item.kategori] ?? item.kategori,
    },
    {
      key: "keparahan",
      label: "Keparahan",
      renderCell: (item) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            QC_TINGKAT_CLASS[item.keparahan],
          )}
        >
          {QC_TINGKAT_LABEL[item.keparahan] ?? item.keparahan}
        </span>
      ),
    },
    {
      key: "sumber",
      label: "Sumber",
      renderCell: (item) => CACAT_SUMBER_LABEL[item.sumber] ?? item.sumber,
    },
    {
      key: "dapatDiperbaiki",
      label: "Bisa Diperbaiki",
      renderCell: (item) => (item.dapatDiperbaiki ? "Ya" : "Tidak"),
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
              placeholder="Cari jenis cacat..."
              className="flex-1 sm:w-64"
            />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onAdd} className="hidden sm:inline-flex">
              + Tambah Jenis Cacat
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
        title="Hapus Jenis Cacat?"
        message="Jenis cacat yang sudah dipakai temuan QC sebaiknya dinonaktifkan saja."
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
