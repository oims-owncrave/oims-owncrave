"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Eye, Play, CheckCircle, Ban, Trash2, Plus, ClipboardCheck } from "lucide-react";
import { useWoQcMutation } from "@/hooks/useWoQc";
import type { WoQcRow } from "@/services/wo-qc";
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
  data: WoQcRow[];
}

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  berjalan: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  selesai: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  dibatalkan: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function WoQcTable({ data }: Props) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isNav, startNav] = useTransition();
  const { setStatus, remove } = useWoQcMutation();

  const actionsFor = (item: WoQcRow): TableAction<WoQcRow>[] => {
    const list: TableAction<WoQcRow>[] = [
      {
        icon: <Eye size={16} />,
        title: "Lihat",
        onClick: (r) => startNav(() => router.push(`/qc/wo/${r.id}`)),
        variant: "default",
      },
    ];

    if (item.status === "draft") {
      list.push(
        {
          icon: <Play size={16} />,
          title: "Mulai kerjakan",
          onClick: (r) => setStatus.mutate({ id: r.id, status: "berjalan" }),
          variant: "default",
        },
        {
          icon: <Trash2 size={16} />,
          title: "Hapus",
          onClick: (r) => setDeleteId(r.id),
          variant: "danger",
        },
      );
    }

    if (item.status === "berjalan") {
      list.push(
        {
          icon: <ClipboardCheck size={16} />,
          title: "Catat hasil QC",
          onClick: (r) => startNav(() => router.push(`/qc/pemeriksaan/baru?wo=${r.id}`)),
          variant: "default",
        },
        {
          icon: <CheckCircle size={16} />,
          title: "Selesaikan",
          onClick: (r) => setStatus.mutate({ id: r.id, status: "selesai" }),
          variant: "default",
        },
        {
          icon: <Ban size={16} />,
          title: "Batalkan",
          onClick: (r) => setStatus.mutate({ id: r.id, status: "dibatalkan" }),
          variant: "danger",
        },
      );
    }

    return list;
  };

  const columns: ColumnDef<WoQcRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    { key: "tanggal", label: "Tanggal", renderCell: (r) => formatTanggal(r.tanggal) },
    { key: "nomorPo", label: "PO", renderCell: (r) => r.nomorPo || "—" },
    {
      key: "metode",
      label: "Metode",
      renderCell: (r) => (r.metode === "sampling" ? "Sampling" : "100%"),
    },
    {
      key: "standarNama",
      label: "Standar QC",
      renderCell: (r) => (r.standarNama ? `${r.standarNama} (v${r.standarVersi})` : "—"),
    },
    { key: "picNama", label: "PIC", renderCell: (r) => r.picNama || "—" },
    {
      key: "totalPcs",
      label: "Progres",
      align: "right",
      renderCell: (r) => {
        const total = Number(r.totalPcs);
        const sudah = Number(r.sudahDiperiksa);
        return (
          <span className={cn(sudah >= total && total > 0 && "font-semibold text-green-600")}>
            {sudah} / {total} pcs
          </span>
        );
      },
    },
    {
      key: "targetSelesai",
      label: "Target",
      renderCell: (r) => formatTanggal(r.targetSelesai),
    },
    {
      key: "status",
      label: "Status",
      renderCell: (r) => (
        <span
          className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_CLASS[r.status])}
        >
          {r.status}
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

  const table = useTable({ data, columns, defaultPageSize: 25, getRowId: (r) => r.id });

  return (
    <>
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch
              table={table}
              placeholder="Cari nomor / PO..."
              className="flex-1 sm:w-64"
            />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              loading={isNav}
              onClick={() => startNav(() => router.push("/qc/wo/baru"))}
              className="hidden sm:inline-flex"
            >
              + Buat Work Order
            </Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          mobileFab={
            <Button
              onClick={() => startNav(() => router.push("/qc/wo/baru"))}
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
        title="Hapus Work Order QC?"
        message="WO yang sudah punya hasil QC tidak bisa dihapus — batalkan saja."
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
