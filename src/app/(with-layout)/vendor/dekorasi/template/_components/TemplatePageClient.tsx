"use client";

import { useState } from "react";
import { cn, formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pencil, Trash2, Plus, TriangleAlert } from "lucide-react";
import { useTemplateList, useTemplateMutation } from "@/hooks/useDekorasi";
import type { TemplateListRow } from "@/services/dekorasi";
import type { Produk } from "@/db/schema";
import { DEKORASI_JENIS_LABEL, DEKORASI_POSISI_LABEL } from "@/lib/schemas/dekorasi";
import { DEKORASI_PROSES_LABEL } from "@/lib/schemas/produk";
import { TemplateFormModal } from "./TemplateFormModal";
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
  initialData: TemplateListRow[];
  produkList: Produk[];
}

export function TemplatePageClient({ initialData, produkList }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<TemplateListRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data } = useTemplateList();
  const { remove } = useTemplateMutation();
  const items = data ?? initialData;

  const actions: TableAction<TemplateListRow>[] = [
    { icon: <Pencil size={16} />, title: "Edit", onClick: (item) => { setEditItem(item); setModalOpen(true); }, variant: "default" },
    { icon: <Trash2 size={16} />, title: "Hapus", onClick: (item) => setDeleteId(item.id), variant: "danger" },
  ];

  const columns: ColumnDef<TemplateListRow>[] = [
    { key: "produkNama", label: "Produk", renderCell: (item) => `${item.produkKode} — ${item.produkNama}` },
    {
      key: "dekorasiProses",
      label: "Setelan Produk",
      renderCell: (item) => {
        const label = DEKORASI_PROSES_LABEL[item.dekorasiProses];
        if (item.dekorasiProses === "none") {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <TriangleAlert size={12} className="shrink-0" />
              {label}
            </span>
          );
        }
        return label;
      },
    },
    { key: "jenis", label: "Jenis", renderCell: (item) => DEKORASI_JENIS_LABEL[item.jenis] },
    { key: "posisi", label: "Posisi", renderCell: (item) => DEKORASI_POSISI_LABEL[item.posisi] },
    { key: "deskripsi", label: "Deskripsi", renderCell: (item) => item.deskripsi ?? "—" },
    { key: "tarifDefault", label: "Tarif Default", align: "right", renderCell: (item) => formatRupiah(item.tarifDefault) },
    {
      key: "isActive",
      label: "Status",
      renderCell: (item) => (
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", item.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400")}>
          {item.isActive ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    { key: "id", label: "Aksi", sortable: false, searchable: false, align: "center", renderCell: (item) => <TableActions item={item} actions={actions} /> },
  ];

  const table = useTable({ data: items, columns, defaultPageSize: 10, getRowId: (item) => item.id });

  return (
    <>
      <div className="rounded-[10px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
        Setel dulu <strong>Proses Dekorasi</strong> di master produk, lalu daftarkan template per posisi di sini.
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari template..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setEditItem(null); setModalOpen(true); }} className="hidden sm:inline-flex">+ Tambah Template</Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          mobileFab={
            <Button onClick={() => { setEditItem(null); setModalOpen(true); }} className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center">
              <Plus size={24} />
            </Button>
          }
        />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>

      <TemplateFormModal open={modalOpen} onClose={() => setModalOpen(false)} initialData={editItem} produkList={produkList} />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Template?"
        message="Template yang sudah dipakai pekerjaan dekorasi tidak bisa dihapus — nonaktifkan saja."
        confirmLabel="Hapus"
        onConfirm={() => { if (deleteId) remove.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
        loading={remove.isPending}
      />
    </>
  );
}
