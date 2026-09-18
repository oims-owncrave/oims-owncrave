"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Eye, Pencil, Trash2, Send, Check, Ban, Plus } from "lucide-react";
import { usePermintaanMutation } from "@/hooks/usePermintaanBahan";
import type { PbListRow } from "@/services/permintaan-bahan";
import { PB_STATUS_BADGE } from "./pb-status";
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

function fmtDate(d: Date | string | null) {
  return d
    ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : "—";
}

export function PbTable({ data }: { data: PbListRow[] }) {
  const router = useRouter();
  const [, startNavigate] = useTransition();
  const [isPendingNew, startTransitionNew] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const { submit, approve, reject, remove } = usePermintaanMutation();

  const go = (path: string) => startTransitionNew(() => router.push(path));

  const goRow = (id: string, path: string) => {
    setPendingId(id);
    startNavigate(() => router.push(path));
  };

  const actionsFor = (item: PbListRow): TableAction<PbListRow>[] => {
    const view: TableAction<PbListRow> = {
      icon: <Eye size={16} />,
      title: "Detail",
      onClick: () => goRow(item.id, `/produksi/permintaan-bahan/${item.id}`),
      variant: "default",
      loading: (it) => pendingId === it.id,
    };
    if (item.status === "draft") {
      return [
        view,
        {
          icon: <Pencil size={16} />,
          title: "Edit",
          onClick: () => goRow(item.id, `/produksi/permintaan-bahan/${item.id}/edit`),
          variant: "default",
          loading: (it) => pendingId === it.id,
        },
        {
          icon: <Send size={16} />,
          title: "Ajukan",
          onClick: () => submit.mutate(item.id),
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
    if (item.status === "diajukan") {
      return [
        view,
        {
          icon: <Check size={16} />,
          title: "Setujui",
          onClick: () => approve.mutate(item.id),
          variant: "default",
        },
        {
          icon: <Ban size={16} />,
          title: "Tolak",
          onClick: () => setRejectId(item.id),
          variant: "danger",
        },
      ];
    }
    return [view];
  };

  const columns: ColumnDef<PbListRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    { key: "poNomor", label: "PO" },
    { key: "produkNama", label: "Produk" },
    {
      key: "tanggal",
      label: "Tanggal",
      renderCell: (item) => fmtDate(item.tanggal),
    },
    {
      key: "tanggalDibutuhkan",
      label: "Dibutuhkan",
      renderCell: (item) => fmtDate(item.tanggalDibutuhkan),
    },
    { key: "jumlahBahan", label: "Jml Bahan", align: "center" },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => {
        const badge = PB_STATUS_BADGE[item.status];
        return (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", badge.className)}>
            {badge.label}
          </span>
        );
      },
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
    getRowId: (item) => item.id,
  });

  return (
    <>
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari permintaan..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => go("/produksi/permintaan-bahan/baru")}
              loading={isPendingNew}
              className="hidden sm:inline-flex"
            >
              + Buat Permintaan
            </Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          getRowLoading={(item) => item.id === pendingId}
          mobileFab={
            <Button
              onClick={() => go("/produksi/permintaan-bahan/baru")}
              loading={isPendingNew}
              className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center"
            >
              <Plus size={24} />
            </Button>
          }
        />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>

      <ConfirmDialog
        open={rejectId !== null}
        title="Tolak Permintaan?"
        message="Permintaan yang ditolak tidak bisa diajukan ulang — buat permintaan baru."
        confirmLabel="Tolak"
        onConfirm={() => {
          if (rejectId) reject.mutate(rejectId);
          setRejectId(null);
        }}
        onCancel={() => setRejectId(null)}
        loading={reject.isPending}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Permintaan?"
        message="Hanya permintaan draft yang bisa dihapus."
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
