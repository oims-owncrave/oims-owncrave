"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatRupiah, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { usePenugasanList, usePenugasanMutation } from "@/hooks/usePenugasanJahit";
import type { PenugasanListRow } from "@/services/penugasan-jahit";
import { PENUGASAN_STATUS_LABEL } from "@/lib/schemas/penugasan-jahit";
import { JENIS_PEKERJAAN_LABEL } from "@/lib/schemas/vendor";
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
  initialData: PenugasanListRow[];
}

export function PenugasanTable({ initialData }: Props) {
  const router = useRouter();
  const [isPendingNew, startTransitionNew] = useTransition();
  const [, startNavigate] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { data } = usePenugasanList();
  const { remove } = usePenugasanMutation();
  const items = data ?? initialData;

  const go = (path: string) => startTransitionNew(() => router.push(path));
  const goRow = (id: string, path: string) => {
    setPendingId(id);
    startNavigate(() => router.push(path));
  };

  const actionsFor = (item: PenugasanListRow): TableAction<PenugasanListRow>[] => {
    const view: TableAction<PenugasanListRow> = {
      icon: <Eye size={16} />,
      title: "Detail",
      onClick: () => goRow(item.id, `/vendor/penugasan/${item.id}`),
      variant: "default",
      loading: (it) => pendingId === it.id,
    };
    if (item.status === "draft") {
      return [
        view,
        { icon: <Pencil size={16} />, title: "Edit", onClick: () => goRow(item.id, `/vendor/penugasan/${item.id}/edit`), variant: "default", loading: (it) => pendingId === it.id },
        { icon: <Trash2 size={16} />, title: "Hapus", onClick: () => setDeleteId(item.id), variant: "danger" },
      ];
    }
    return [view];
  };

  const columns: ColumnDef<PenugasanListRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    { key: "poNomor", label: "PO" },
    { key: "produkNama", label: "Produk" },
    { key: "pihakNama", label: "Vendor / Penjahit" },
    {
      key: "jenisPekerjaan",
      label: "Pekerjaan",
      renderCell: (item) => JENIS_PEKERJAAN_LABEL[item.jenisPekerjaan],
    },
    {
      key: "totalPcs",
      label: "Bundel / Pcs",
      align: "right",
      renderCell: (item) => (
        <span className="whitespace-nowrap">{item.totalBundel} bdl · {item.totalPcs} pcs</span>
      ),
    },
    {
      key: "estimasiBiaya",
      label: "Estimasi Biaya",
      align: "right",
      renderCell: (item) => formatRupiah(item.estimasiBiaya),
    },
    {
      key: "targetSelesai",
      label: "Target Selesai",
      renderCell: (item) => formatTanggal(item.targetSelesai),
    },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => {
        const badge = PENUGASAN_STATUS_LABEL[item.status];
        return (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", badge.className)}>
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

  const table = useTable({ data: items, columns, defaultPageSize: 10, getRowId: (item) => item.id });

  return (
    <>
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari penugasan..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => go("/vendor/penugasan/baru")} loading={isPendingNew} className="hidden sm:inline-flex">
              + Buat Penugasan
            </Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          getRowLoading={(item) => item.id === pendingId}
          mobileFab={
            <Button
              onClick={() => go("/vendor/penugasan/baru")}
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
        title="Hapus Penugasan?"
        message="Hanya penugasan draft yang bisa dihapus. Bundel akan kembali bebas ditugaskan."
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
