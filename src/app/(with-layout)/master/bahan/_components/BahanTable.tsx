"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pencil, Trash2 } from "lucide-react";
import { useBahanMutation } from "@/hooks/useBahan";
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

type BahanItem = {
  id: string;
  kode: string;
  nama: string;
  kategoriId: string;
  kategoriNama: string | null;
  satuanId: string;
  satuanNama: string | null;
  satuanSingkatan: string | null;
  stokMinimum: string;
  hargaRataRata: string;
  isActive: boolean;
};

interface Props {
  data: BahanItem[];
  onEdit: (item: BahanItem) => void;
  onAdd: () => void;
}

export function BahanTable({ data, onEdit, onAdd }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { remove } = useBahanMutation();

  const actions: TableAction<BahanItem>[] = [
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

  const columns: ColumnDef<BahanItem>[] = [
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama Bahan" },
    {
      key: "kategoriNama",
      label: "Kategori",
      renderCell: (item) => item.kategoriNama || "-",
    },
    {
      key: "satuanNama",
      label: "Satuan",
      renderCell: (item) => item.satuanNama || "-",
    },
    {
      key: "stokMinimum",
      label: "Stok Min",
      align: "right",
      renderCell: (item) => `${Number(item.stokMinimum)} ${item.satuanSingkatan || ""}`,
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
          <TableSearch table={table} placeholder="Cari bahan..." />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ColumnToggle table={table} className="flex-1 sm:flex-none justify-center" />
            <Button onClick={onAdd} className="flex-1 sm:flex-none">+ Tambah Bahan</Button>
          </div>
        </TableToolbar>
        <DataTable table={table} showRowNumber />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Bahan?"
        message="Bahan yang sudah punya transaksi tidak bisa dihapus — nonaktifkan saja."
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
