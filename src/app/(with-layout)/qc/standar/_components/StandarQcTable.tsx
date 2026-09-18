"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pencil, Trash2, Plus, CheckCircle, Ban, CopyPlus, Eye } from "lucide-react";
import { useStandarQcMutation } from "@/hooks/useStandarQc";
import type { StandarQcRow } from "@/services/standar-qc";
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
  data: StandarQcRow[];
}

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  aktif: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  nonaktif: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export function StandarQcTable({ data }: Props) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isNav, startNav] = useTransition();
  const [loadingRowId, setLoadingRowId] = useState<string | null>(null);
  const { versiBaru, activate, deactivate, remove } = useStandarQcMutation();

  const go = (path: string, rowId?: string) => {
    if (rowId) setLoadingRowId(rowId);
    startNav(() => router.push(path));
  };

  useEffect(() => {
    if (!isNav) setLoadingRowId(null);
  }, [isNav]);

  // aksi ikut status: draft bisa edit/aktifkan, aktif bisa nonaktifkan/versi baru
  const actionsFor = (item: StandarQcRow): TableAction<StandarQcRow>[] => {
    const list: TableAction<StandarQcRow>[] = [
      {
        icon: <Eye size={16} />,
        title: "Lihat",
        onClick: (r) => go(`/qc/standar/${r.id}`, r.id),
        variant: "default",
      },
    ];

    if (item.status === "draft") {
      list.push(
        {
          icon: <Pencil size={16} />,
          title: "Edit",
          onClick: (r) => go(`/qc/standar/${r.id}/edit`, r.id),
          variant: "default",
        },
        {
          icon: <CheckCircle size={16} />,
          title: "Aktifkan",
          onClick: (r) => activate.mutate(r.id),
          variant: "default",
        },
        {
          icon: <Trash2 size={16} />,
          title: "Hapus",
          onClick: (r) => setDeleteId(r.id),
          variant: "danger",
        },
      );
    } else {
      list.push({
        icon: <CopyPlus size={16} />,
        title: "Buat versi baru",
        onClick: (r) => versiBaru.mutate(r.id),
        variant: "default",
      });
      if (item.status === "aktif") {
        list.push({
          icon: <Ban size={16} />,
          title: "Nonaktifkan",
          onClick: (r) => deactivate.mutate(r.id),
          variant: "danger",
        });
      }
    }

    return list;
  };

  const columns: ColumnDef<StandarQcRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    { key: "nama", label: "Nama Standar" },
    {
      key: "produkNama",
      label: "Produk",
      renderCell: (r) => r.produkNama || "— semua —",
    },
    {
      key: "kategoriNama",
      label: "Kategori",
      renderCell: (r) => r.kategoriNama || "—",
    },
    {
      key: "versi",
      label: "Versi",
      align: "right",
      renderCell: (r) => `v${r.versi}`,
    },
    {
      key: "jumlahKriteria",
      label: "Kriteria",
      align: "right",
      renderCell: (r) => Number(r.jumlahKriteria),
    },
    {
      key: "tanggalBerlaku",
      label: "Berlaku",
      renderCell: (r) => formatTanggal(r.tanggalBerlaku),
    },
    {
      key: "status",
      label: "Status",
      renderCell: (r) => (
        <span
          className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_CLASS[r.status])}
        >
          {r.status === "aktif" ? "Aktif" : r.status === "draft" ? "Draft" : "Nonaktif"}
        </span>
      ),
    },
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
    getRowId: (r) => r.id,
  });

  return (
    <>
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch
              table={table}
              placeholder="Cari standar / produk..."
              className="flex-1 sm:w-64"
            />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              loading={isNav}
              onClick={() => go("/qc/standar/baru")}
              className="hidden sm:inline-flex"
            >
              + Tambah Standar
            </Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          getRowLoading={(item) => item.id === loadingRowId}
          mobileFab={
            <Button
              onClick={() => go("/qc/standar/baru")}
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
        title="Hapus Standar QC?"
        message="Standar yang sudah dipakai Work Order QC tidak bisa dihapus — nonaktifkan saja."
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
