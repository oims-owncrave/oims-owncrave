"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Eye, Pencil, Trash2, Plus, Send, Check, Ban } from "lucide-react";
import { usePoMutation } from "@/hooks/usePoProduksi";
import type { PoListRow } from "@/services/po-produksi";
import { PO_STATUS_BADGE, PO_JENIS_LABEL, PO_PRIORITAS_LABEL } from "./po-status";
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

export function PoTable({ data }: { data: PoListRow[] }) {
  const router = useRouter();
  const [isPendingNew, startTransitionNew] = useTransition();
  const [, startNavigate] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const { submit, approve, cancel, remove } = usePoMutation();

  const go = (path: string) => startTransitionNew(() => router.push(path));
  const goRow = (id: string, path: string) => {
    setPendingId(id);
    startNavigate(() => router.push(path));
  };

  const actionsFor = (item: PoListRow): TableAction<PoListRow>[] => {
    const view: TableAction<PoListRow> = {
      icon: <Eye size={16} />,
      title: "Detail",
      onClick: () => goRow(item.id, `/produksi/po/${item.id}`),
      variant: "default",
      loading: (it) => pendingId === it.id,
    };
    if (item.status === "draft") {
      return [
        view,
        {
          icon: <Pencil size={16} />,
          title: "Edit",
          onClick: () => goRow(item.id, `/produksi/po/${item.id}/edit`),
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
    if (item.status === "menunggu_persetujuan") {
      return [
        view,
        {
          icon: <Check size={16} />,
          title: "Setujui",
          onClick: () => setApproveId(item.id),
          variant: "default",
        },
        {
          icon: <Ban size={16} />,
          title: "Batalkan",
          onClick: () => setCancelId(item.id),
          variant: "danger",
        },
      ];
    }
    if (item.status === "disetujui" || item.status === "menunggu_bahan") {
      return [
        view,
        {
          icon: <Ban size={16} />,
          title: "Batalkan",
          onClick: () => setCancelId(item.id),
          variant: "danger",
        },
      ];
    }
    return [view];
  };

  const columns: ColumnDef<PoListRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    {
      key: "produkNama",
      label: "Produk",
      renderCell: (item) => `${item.produkKode} — ${item.produkNama}`,
    },
    { key: "totalTarget", label: "Target (pcs)", align: "center" },
    {
      key: "jenis",
      label: "Jenis",
      renderCell: (item) => PO_JENIS_LABEL[item.jenis],
    },
    {
      key: "prioritas",
      label: "Prioritas",
      renderCell: (item) => PO_PRIORITAS_LABEL[item.prioritas] ?? item.prioritas,
    },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => {
        const badge = PO_STATUS_BADGE[item.status];
        return (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", badge.className)}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: "targetSelesai",
      label: "Target Selesai",
      renderCell: (item) =>
        item.targetSelesai
          ? new Date(item.targetSelesai).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
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
            <TableSearch table={table} placeholder="Cari PO..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => go("/produksi/po/baru")} loading={isPendingNew} className="hidden sm:inline-flex">
              + Buat PO
            </Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          mobileFab={
            <Button
              onClick={() => go("/produksi/po/baru")}
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
        open={approveId !== null}
        title="Setujui PO?"
        message="BOM aktif produk akan dikunci ke PO ini untuk estimasi bahan."
        confirmLabel="Setujui"
        onConfirm={() => {
          if (approveId) approve.mutate(approveId);
          setApproveId(null);
        }}
        onCancel={() => setApproveId(null)}
        loading={approve.isPending}
      />

      <ConfirmDialog
        open={cancelId !== null}
        title="Batalkan PO?"
        message="PO yang dibatalkan tidak bisa diaktifkan lagi."
        confirmLabel="Batalkan PO"
        onConfirm={() => {
          if (cancelId) cancel.mutate(cancelId);
          setCancelId(null);
        }}
        onCancel={() => setCancelId(null)}
        loading={cancel.isPending}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus PO?"
        message="Hanya PO draft yang bisa dihapus."
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
