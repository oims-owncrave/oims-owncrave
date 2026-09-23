"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { Pencil, Trash2, Plus, Upload } from "lucide-react";
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
  ukuran: string | null;
  kategoriId: string;
  kategoriNama: string | null;
  satuanId: string;
  satuanNama: string | null;
  satuanSingkatan: string | null;
  stokMinimum: string;
  hargaRataRata: string;
  warnaId: string | null;
  warnaNama: string | null;
  isActive: boolean;
};

interface Props {
  data: BahanItem[];
  onEdit: (item: BahanItem) => void;
  onAdd: () => void;
  onImport: () => void;
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export function BahanTable({ data, onEdit, onAdd, onImport }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [kategoriId, setKategoriId] = useState("");
  const { remove } = useBahanMutation();

  const kategoriOpts = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of data) {
      if (item.kategoriId && !seen.has(item.kategoriId)) {
        seen.set(item.kategoriId, item.kategoriNama || "-");
      }
    }
    return [
      { label: "Semua Kategori", value: "" },
      ...Array.from(seen, ([value, label]) => ({ label, value })).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    ];
  }, [data]);

  const filteredData = useMemo(
    () => (kategoriId ? data.filter((item) => item.kategoriId === kategoriId) : data),
    [data, kategoriId],
  );

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
      key: "ukuran",
      label: "Ket",
      renderCell: (item) => item.ukuran || "—",
    },
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
      key: "warnaNama",
      label: "Warna",
      mobileRole: "detail",
      renderCell: (item) => item.warnaNama || "-",
    },
    {
      key: "hargaRataRata",
      label: "Harga Rata²",
      align: "right",
      mobileRole: "highlight",
      renderCell: (item) => rupiah(Number(item.hargaRataRata ?? 0)),
    },
    {
      key: "stokMinimum",
      label: "Stok Min",
      align: "right",
      mobileRole: "detail",
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
    data: filteredData,
    columns,
    defaultPageSize: 10,
    getRowId: (item) => item.id,
  });

  return (
    <>
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex flex-col gap-3 w-full sm:flex-row sm:flex-wrap sm:items-center sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <TableSearch table={table} placeholder="Cari bahan..." className="flex-1 sm:w-64" />
              <ColumnToggle table={table} className="shrink-0" />
            </div>
            <ComboSelect
              variant="filter"
              placeholder="Semua Kategori"
              options={kategoriOpts}
              value={kategoriId || null}
              onChange={(v) => setKategoriId((v as string) ?? "")}
              className="w-full sm:w-44"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onImport} className="hidden sm:inline-flex">
              <Upload size={16} className="mr-2" /> Import
            </Button>
            <Button onClick={onAdd} className="hidden sm:inline-flex">+ Tambah Bahan</Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
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
