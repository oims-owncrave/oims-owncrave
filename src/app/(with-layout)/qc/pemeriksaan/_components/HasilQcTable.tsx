"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Eye, CheckCircle, Trash2, Plus } from "lucide-react";
import { useHasilQcMutation } from "@/hooks/useHasilQc";
import type { HasilQcRow } from "@/services/hasil-qc";
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
  data: HasilQcRow[];
}

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  selesai: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  diverifikasi: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

export function HasilQcTable({ data }: Props) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPendingNew, startTransitionNew] = useTransition();
  const [isNav, startNav] = useTransition();
  const [loadingRowId, setLoadingRowId] = useState<string | null>(null);
  const { verifikasi, remove } = useHasilQcMutation();

  const goNew = (path: string) => startTransitionNew(() => router.push(path));
  const goRow = (path: string, rowId: string) => {
    setLoadingRowId(rowId);
    startNav(() => router.push(path));
  };

  useEffect(() => {
    if (!isNav) setLoadingRowId(null);
  }, [isNav]);

  const actionsFor = (item: HasilQcRow): TableAction<HasilQcRow>[] => {
    const list: TableAction<HasilQcRow>[] = [
      {
        icon: <Eye size={16} />,
        title: "Lihat & catat cacat",
        onClick: (r) => goRow(`/qc/pemeriksaan/${r.id}`, r.id),
        variant: "default",
      },
    ];

    if (item.status !== "diverifikasi") {
      list.push(
        {
          icon: <CheckCircle size={16} />,
          title: "Verifikasi",
          onClick: (r) => verifikasi.mutate(r.id),
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

    return list;
  };

  const columns: ColumnDef<HasilQcRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    { key: "tanggal", label: "Tanggal", renderCell: (r) => formatTanggal(r.tanggal) },
    { key: "nomorWo", label: "Work Order" },
    { key: "nomorPo", label: "PO", renderCell: (r) => r.nomorPo || "—" },
    {
      key: "diperiksa",
      label: "Diperiksa",
      align: "right",
      renderCell: (r) => Number(r.diperiksa),
    },
    { key: "gradeA", label: "Grade A", align: "right", renderCell: (r) => Number(r.gradeA) },
    {
      key: "perbaikan",
      label: "Perbaikan",
      align: "right",
      renderCell: (r) => Number(r.perbaikan),
    },
    { key: "reject", label: "Reject", align: "right", renderCell: (r) => Number(r.reject) },
    {
      key: "bermasalah",
      label: "Defect Rate",
      align: "right",
      renderCell: (r) => {
        const d = Number(r.diperiksa);
        const rate = d > 0 ? (Number(r.bermasalah) / d) * 100 : 0;
        return (
          <span
            className={cn(
              "font-medium",
              rate >= 20 ? "text-red-600" : rate >= 10 ? "text-amber-600" : "text-green-600",
            )}
          >
            {rate.toFixed(1)}%
          </span>
        );
      },
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
              placeholder="Cari nomor / WO / PO..."
              className="flex-1 sm:w-64"
            />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              loading={isPendingNew}
              onClick={() => goNew("/qc/pemeriksaan/baru")}
              className="hidden sm:inline-flex"
            >
              + Catat Hasil QC
            </Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          getRowLoading={(item) => item.id === loadingRowId}
          mobileFab={
            <Button
              onClick={() => goNew("/qc/pemeriksaan/baru")}
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
        open={deleteId !== null}
        title="Hapus Hasil QC?"
        message="Hasil yang sudah diverifikasi atau sudah punya temuan cacat tidak bisa dihapus."
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
