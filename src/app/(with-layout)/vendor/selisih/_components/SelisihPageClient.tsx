"use client";

import { useState } from "react";
import { cn, formatRupiah, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pencil, Trash2, Plus, Search, Gavel } from "lucide-react";
import { useSelisihList, useSelisihMutation } from "@/hooks/useSelisihJahit";
import type { SelisihListRow } from "@/services/selisih-jahit";
import { KLASIFIKASI_LABEL, SELISIH_STATUS_LABEL, KEPUTUSAN_LABEL } from "@/lib/schemas/selisih-jahit";
import { SelisihFormModal } from "./SelisihFormModal";
import { KeputusanModal } from "./KeputusanModal";
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
  initialData: SelisihListRow[];
}

export function SelisihPageClient({ initialData }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<SelisihListRow | null>(null);
  const [putusItem, setPutusItem] = useState<SelisihListRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data } = useSelisihList();
  const { selidiki, remove } = useSelisihMutation();
  const items = data ?? initialData;

  const actionsFor = (item: SelisihListRow): TableAction<SelisihListRow>[] => {
    if (item.keputusan) return [];
    const a: TableAction<SelisihListRow>[] = [
      { icon: <Pencil size={16} />, title: "Edit", onClick: () => { setEditItem(item); setFormOpen(true); }, variant: "default" },
    ];
    if (item.status === "dibuka") a.push({ icon: <Search size={16} />, title: "Tandai diselidiki", onClick: () => selidiki.mutate(item.id), variant: "default" });
    a.push({ icon: <Gavel size={16} />, title: "Putuskan (owner)", onClick: () => setPutusItem(item), variant: "default" });
    if (!(item.penerimaanId && item.klasifikasi === "rusak")) {
      a.push({ icon: <Trash2 size={16} />, title: "Hapus", onClick: () => setDeleteId(item.id), variant: "danger" });
    }
    return a;
  };

  const columns: ColumnDef<SelisihListRow>[] = [
    { key: "nomorKasus", label: "Kasus" },
    {
      key: "klasifikasi",
      label: "Klasifikasi",
      renderCell: (item) => (
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", item.klasifikasi === "hilang" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : item.klasifikasi === "rusak" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400")}>
          {KLASIFIKASI_LABEL[item.klasifikasi]}
        </span>
      ),
    },
    { key: "bundelNomor", label: "Bundel", renderCell: (item) => <span className="whitespace-nowrap">{item.bundelNomor} <span className="text-xs text-dark-5">{item.sku}</span></span> },
    { key: "penugasanNomor", label: "Penugasan" },
    { key: "pihakNama", label: "Vendor / Penjahit" },
    { key: "jumlah", label: "Pcs", align: "right" },
    { key: "nilaiPerPcs", label: "Nilai", align: "right", renderCell: (item) => formatRupiah(Number(item.nilaiPerPcs) * item.jumlah) },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => {
        const b = SELISIH_STATUS_LABEL[item.status];
        return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", b.className)}>{b.label}</span>;
      },
    },
    {
      key: "keputusan",
      label: "Keputusan",
      renderCell: (item) => item.keputusan ? <span className="text-xs">{KEPUTUSAN_LABEL[item.keputusan]}<br /><span className="text-dark-5">{item.approvedByNama} · {formatTanggal(item.approvedAt)}</span></span> : "—",
    },
    { key: "createdAt", label: "Dibuka", renderCell: (item) => formatTanggal(item.createdAt) },
    {
      key: "id",
      label: "Aksi",
      sortable: false,
      searchable: false,
      align: "center",
      renderCell: (item) => <TableActions item={item} actions={actionsFor(item)} />,
    },
  ];

  const table = useTable({ data: items, columns, defaultPageSize: 10, getRowId: (item) => item.id });

  return (
    <>
      <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
        Kasus <strong>hilang</strong> dan <strong>rusak</strong> baru mengurangi sisa WIP setelah <strong>diputuskan owner</strong>. Rusak dari penerimaan hasil dibuka otomatis.
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari kasus..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="hidden sm:inline-flex">+ Buka Kasus</Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          mobileFab={
            <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center">
              <Plus size={24} />
            </Button>
          }
        />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>

      <SelisihFormModal open={formOpen} onClose={() => setFormOpen(false)} initialData={editItem} />
      <KeputusanModal item={putusItem} onClose={() => setPutusItem(null)} />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Kasus?"
        message="Hanya kasus yang belum diputuskan yang bisa dihapus."
        confirmLabel="Hapus"
        onConfirm={() => { if (deleteId) remove.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
        loading={remove.isPending}
      />
    </>
  );
}
