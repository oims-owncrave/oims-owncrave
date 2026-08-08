"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
import { usePenyesuaianMutation } from "@/hooks/usePenyesuaian";
import type { PenyesuaianRow } from "@/services/penyesuaian";

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));

const STATUS_CONFIG = {
  pending: {
    label: "Menunggu",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  approved: {
    label: "Disetujui",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  rejected: {
    label: "Ditolak",
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
} as const;

interface Props {
  data: PenyesuaianRow[];
  isOwner: boolean;
  onAdd: () => void;
}

export function PenyesuaianTable({ data, isOwner, onAdd }: Props) {
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const { approve, reject } = usePenyesuaianMutation();
  const [isPendingNew, startTransitionNew] = useTransition();
  const router = useRouter();

  const actions: TableAction<PenyesuaianRow>[] = isOwner
    ? [
        {
          icon: <Check size={15} strokeWidth={2.5} />,
          title: "Approve",
          variant: "default",
          hidden: (item) => item.status !== "pending",
          onClick: (item) => setApproveId(item.id),
        },
        {
          icon: <X size={15} strokeWidth={2.5} />,
          title: "Tolak",
          variant: "danger",
          hidden: (item) => item.status !== "pending",
          onClick: (item) => setRejectId(item.id),
        },
      ]
    : [];

  const columns: ColumnDef<PenyesuaianRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    {
      key: "tanggal",
      label: "Tanggal",
      renderCell: (item) => fmtDate(item.tanggal),
    },
    {
      key: "bahanNama",
      label: "Bahan",
      renderCell: (item) => (
        <span>
          <span className="font-mono text-xs text-dark-5 dark:text-dark-6">
            {item.bahanKode}
          </span>{" "}
          {item.bahanNama}
        </span>
      ),
    },
    {
      key: "kuantitasSebelum",
      label: "Sebelum → Sesudah",
      searchable: false,
      renderCell: (item) => {
        const selisih = Number(item.selisih);
        return (
          <span className="text-sm">
            {Number(item.kuantitasSebelum).toLocaleString("id-ID", { maximumFractionDigits: 3 })}
            {" → "}
            {Number(item.kuantitasSetelah).toLocaleString("id-ID", { maximumFractionDigits: 3 })}{" "}
            <span
              className={cn(
                "font-mono font-medium",
                selisih > 0
                  ? "text-green-600 dark:text-green-400"
                  : selisih < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-dark-5 dark:text-dark-6",
              )}
            >
              ({selisih > 0 ? "+" : ""}{selisih.toLocaleString("id-ID", { maximumFractionDigits: 3 })} {item.satuanSingkatan || ""})
            </span>
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => {
        const cfg = STATUS_CONFIG[item.status];
        return (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", cfg.cls)}>
            {cfg.label}
          </span>
        );
      },
    },
    ...(isOwner
      ? [
          {
            key: "id" as keyof PenyesuaianRow,
            label: "Aksi",
            sortable: false,
            searchable: false,
            align: "center" as const,
            renderCell: (item: PenyesuaianRow) =>
              item.status === "pending" ? (
                <TableActions item={item} actions={actions} />
              ) : (
                <span className="text-xs text-dark-5 dark:text-dark-6">—</span>
              ),
          },
        ]
      : []),
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
            <TableSearch table={table} placeholder="Cari nomor / bahan..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <Button
            loading={isPendingNew}
            className="hidden sm:inline-flex"
            onClick={() =>
              startTransitionNew(() =>
                router.push("/inventory/penyesuaian/baru"),
              )
            }
          >
            + Penyesuaian Baru
          </Button>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          mobileFab={
            <Button
              disabled={isPendingNew}
              onClick={() =>
                startTransitionNew(() =>
                  router.push("/inventory/penyesuaian/baru"),
                )
              }
              className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center cursor-pointer"
            >
              {isPendingNew ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Plus size={24} />
              )}
            </Button>
          }
        />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>

      {/* Approve dialog */}
      <ConfirmDialog
        open={approveId !== null}
        title="Setujui Penyesuaian?"
        message="Tindakan ini akan mengubah stok secara permanen dan mencatat mutasi. Tidak dapat dibatalkan."
        confirmLabel="Ya, Setujui"
        danger={false}
        onConfirm={() => {
          if (approveId) approve.mutate(approveId);
          setApproveId(null);
        }}
        onCancel={() => setApproveId(null)}
        loading={approve.isPending}
      />

      {/* Reject dialog */}
      <ConfirmDialog
        open={rejectId !== null}
        title="Tolak Penyesuaian?"
        message="Penyesuaian akan ditolak. Stok tidak akan berubah."
        confirmLabel="Ya, Tolak"
        onConfirm={() => {
          if (rejectId) reject.mutate(rejectId);
          setRejectId(null);
        }}
        onCancel={() => setRejectId(null)}
        loading={reject.isPending}
      />
    </>
  );
}
