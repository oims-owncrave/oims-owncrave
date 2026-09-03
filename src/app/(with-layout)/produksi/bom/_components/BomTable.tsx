"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Eye, Pencil, Trash2, Plus, Check, Ban, Copy, Upload } from "lucide-react";
import { useBomMutation } from "@/hooks/useBom";
import type { BomListRow } from "@/services/bom";
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

const STATUS_BADGE: Record<BomListRow["status"], { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  aktif: {
    label: "Aktif",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  nonaktif: {
    label: "Nonaktif",
    className: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  },
};

export function BomTable({ data, onImport }: { data: BomListRow[]; onImport: () => void }) {
  const router = useRouter();
  const [, startNavigate] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activateId, setActivateId] = useState<string | null>(null);
  const { activate, deactivate, newVersion, remove } = useBomMutation();

  const go = (path: string) => startNavigate(() => router.push(path));

  const actionsFor = (item: BomListRow): TableAction<BomListRow>[] => {
    const view: TableAction<BomListRow> = {
      icon: <Eye size={16} />,
      title: "Detail",
      onClick: () => go(`/produksi/bom/${item.id}`),
      variant: "default",
    };
    const copy: TableAction<BomListRow> = {
      icon: <Copy size={16} />,
      title: "Versi Baru",
      onClick: () => newVersion.mutate(item.id),
      variant: "default",
    };

    if (item.status === "draft") {
      return [
        view,
        {
          icon: <Pencil size={16} />,
          title: "Edit",
          onClick: () => go(`/produksi/bom/${item.id}/edit`),
          variant: "default",
        },
        {
          icon: <Check size={16} />,
          title: "Aktifkan",
          onClick: () => setActivateId(item.id),
          variant: "default",
        },
        {
          icon: <Trash2 size={16} />,
          title: "Hapus",
          onClick: () => setDeleteId(item.id),
          variant: "danger",
        },
      ];
    }
    if (item.status === "aktif") {
      return [
        view,
        copy,
        {
          icon: <Ban size={16} />,
          title: "Nonaktifkan",
          onClick: () => deactivate.mutate(item.id),
          variant: "danger",
        },
      ];
    }
    return [view, copy];
  };

  const columns: ColumnDef<BomListRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    {
      key: "produkNama",
      label: "Produk",
      renderCell: (item) => `${item.produkKode} — ${item.produkNama}`,
    },
    { key: "versi", label: "Versi", align: "center" },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => {
        const badge = STATUS_BADGE[item.status];
        return (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", badge.className)}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: "tanggalBerlaku",
      label: "Tanggal Berlaku",
      renderCell: (item) =>
        item.tanggalBerlaku
          ? new Date(item.tanggalBerlaku).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
    },
    { key: "jumlahBahan", label: "Jml Bahan", align: "center" },
    {
      key: "id",
      label: "Aksi",
      sortable: false,
      searchable: false,
      align: "center",
      renderCell: (item) => <TableActions item={item} actions={actionsFor(item)} />,
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
            <TableSearch table={table} placeholder="Cari BOM..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onImport} className="hidden sm:inline-flex">
              <Upload size={16} className="mr-2" /> Import
            </Button>
            <Button onClick={() => go("/produksi/bom/baru")} className="hidden sm:inline-flex">
              + Buat BOM
            </Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          mobileFab={
            <Button
              onClick={() => go("/produksi/bom/baru")}
              className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center"
            >
              <Plus size={24} />
            </Button>
          }
        />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>

      <ConfirmDialog
        open={activateId !== null}
        title="Aktifkan BOM?"
        message="Versi aktif lama produk ini (jika ada) otomatis dinonaktifkan."
        confirmLabel="Aktifkan"
        onConfirm={() => {
          if (activateId) activate.mutate(activateId);
          setActivateId(null);
        }}
        onCancel={() => setActivateId(null)}
        loading={activate.isPending}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus BOM?"
        message="Hanya BOM draft yang bisa dihapus."
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
