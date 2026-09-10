"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pencil, Trash2, Plus, CheckCircle2, Ban, CopyPlus } from "lucide-react";
import { useTarifJasaJahitMutation } from "@/hooks/useTarifJasaJahit";
import { JENIS_PEKERJAAN_LABEL } from "@/lib/schemas/vendor";
import { DASAR_TARIF_LABEL, TARIF_STATUS_LABEL } from "@/lib/schemas/tarif-jasa-jahit";
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

export type TarifRow = {
  id: string;
  produkId: string;
  produkNama: string;
  varianId: string | null;
  varianSku: string | null;
  jenisPekerjaan: keyof typeof JENIS_PEKERJAAN_LABEL;
  vendorId: string | null;
  vendorNama: string | null;
  penjahitId: string | null;
  penjahitNama: string | null;
  dasarTarif: keyof typeof DASAR_TARIF_LABEL;
  nominal: string;
  tanggalBerlaku: Date;
  versi: number;
  status: keyof typeof TARIF_STATUS_LABEL;
  catatan: string | null;
};

const rupiah = (v: string) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
    .format(Number(v));

interface Props {
  data: TarifRow[];
  onEdit: (item: TarifRow) => void;
  onAdd: () => void;
  onVersiBaru: (item: TarifRow) => void;
}

export function TarifTable({ data, onEdit, onAdd, onVersiBaru }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { remove, activate, deactivate } = useTarifJasaJahitMutation();

  const actions: TableAction<TarifRow>[] = [
    {
      icon: <Pencil size={16} />,
      title: "Edit (hanya draft)",
      onClick: (item) => onEdit(item),
      variant: "default",
      hidden: (item) => item.status !== "draft",
    },
    {
      icon: <CheckCircle2 size={16} />,
      title: "Aktifkan",
      onClick: (item) => activate.mutate(item.id),
      variant: "default",
      hidden: (item) => item.status !== "draft",
    },
    {
      icon: <CopyPlus size={16} />,
      title: "Buat versi baru (ubah harga)",
      onClick: (item) => onVersiBaru(item),
      variant: "default",
      hidden: (item) => item.status !== "aktif",
    },
    {
      icon: <Ban size={16} />,
      title: "Nonaktifkan",
      onClick: (item) => deactivate.mutate(item.id),
      variant: "danger",
      hidden: (item) => item.status !== "aktif",
    },
    {
      icon: <Trash2 size={16} />,
      title: "Hapus",
      onClick: (item) => setDeleteId(item.id),
      variant: "danger",
      hidden: (item) => item.status === "aktif",
    },
  ];

  const columns: ColumnDef<TarifRow>[] = [
    { key: "produkNama", label: "Produk" },
    {
      key: "varianSku",
      label: "Varian",
      renderCell: (item) => item.varianSku || "Semua varian",
    },
    {
      key: "jenisPekerjaan",
      label: "Pekerjaan",
      renderCell: (item) => JENIS_PEKERJAAN_LABEL[item.jenisPekerjaan],
    },
    {
      key: "vendorNama",
      label: "Vendor / Penjahit",
      renderCell: (item) => item.vendorNama || item.penjahitNama || "—",
    },
    {
      key: "nominal",
      label: "Tarif",
      align: "right",
      renderCell: (item) => (
        <span className="font-medium">
          {rupiah(item.nominal)}
          <span className="ml-1 text-xs font-normal text-dark-5 dark:text-dark-6">
            /{DASAR_TARIF_LABEL[item.dasarTarif].replace("Per ", "").toLowerCase()}
          </span>
        </span>
      ),
    },
    { key: "versi", label: "Versi", align: "center", renderCell: (item) => `v${item.versi}` },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            item.status === "aktif" &&
              "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
            item.status === "draft" &&
              "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
            item.status === "nonaktif" &&
              "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
          )}
        >
          {TARIF_STATUS_LABEL[item.status]}
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

  const table = useTable({ data, columns, defaultPageSize: 10, getRowId: (item) => item.id });

  return (
    <>
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari tarif..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onAdd} className="hidden sm:inline-flex">+ Tambah Tarif</Button>
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
        title="Hapus Tarif?"
        message="Tarif aktif tidak bisa dihapus — nonaktifkan dulu. Riwayat versi tetap tersimpan."
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
