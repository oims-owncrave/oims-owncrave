"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pencil, Trash2, Plus, Layers, Upload, ClipboardList } from "lucide-react";
import { useProdukMutation } from "@/hooks/useProduk";
import type { Produk } from "@/db/schema";
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

/** listProduk() menambah bomAktifId — null berarti produk belum punya resep. */
type ProdukRow = Produk & { bomAktifId?: string | null };

interface Props {
  data: ProdukRow[];
  onEdit: (item: ProdukRow) => void;
  onAdd: () => void;
  onImport: () => void;
}

export function ProdukTable({ data, onEdit, onAdd, onImport }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { remove } = useProdukMutation();
  const router = useRouter();
  const [, startNavigate] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const goRow = (id: string, path: string) => {
    setPendingId(id);
    startNavigate(() => router.push(path));
  };

  const actions: TableAction<ProdukRow>[] = [
    {
      icon: <Layers size={16} />,
      title: "Varian",
      onClick: (item) => goRow(item.id, `/produksi/produk/${item.id}`),
      variant: "default",
    },
    {
      // Resep = BOM. Sudah ada -> buka BOM-nya; belum -> form BOM dengan produk terpilih.
      // Sengaja memakai halaman /produksi/bom yang sudah ada, bukan editor bahan kedua.
      icon: <ClipboardList size={16} />,
      title: "Resep bahan (BOM)",
      onClick: (item) =>
        goRow(
          item.id,
          item.bomAktifId
            ? `/produksi/bom/${item.bomAktifId}`
            : `/produksi/bom/baru?produk=${item.id}`,
        ),
      variant: "default",
    },
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

  const columns: ColumnDef<Produk>[] = [
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama Produk" },
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
            <TableSearch table={table} placeholder="Cari produk..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onImport} className="hidden sm:inline-flex">
              <Upload size={16} className="mr-2" /> Import
            </Button>
            <Button onClick={onAdd} className="hidden sm:inline-flex">+ Tambah Produk</Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          getRowLoading={(item) => item.id === pendingId}
          mobileFab={
            <Button onClick={onAdd} className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center">
              <Plus size={24} />
            </Button>
          }
        />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Produk?"
        message="Produk yang sudah punya varian tidak bisa dihapus — nonaktifkan saja."
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
