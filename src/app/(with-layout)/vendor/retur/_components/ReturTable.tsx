"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatRupiah, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { useReturList, useReturMutation } from "@/hooks/useReturJahit";
import type { ReturListRow } from "@/services/retur-jahit";
import { RETUR_STATUS_LABEL } from "@/lib/schemas/retur-jahit";
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
  initialData: ReturListRow[];
}

export function ReturTable({ initialData }: Props) {
  const router = useRouter();
  const [isPendingNew, startTransitionNew] = useTransition();
  const [, startNavigate] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data } = useReturList();
  const { remove } = useReturMutation();
  const items = data ?? initialData;
  const go = (path: string) => startTransitionNew(() => router.push(path));
  const goRow = (id: string, path: string) => {
    setPendingId(id);
    startNavigate(() => router.push(path));
  };

  const actionsFor = (item: ReturListRow): TableAction<ReturListRow>[] => {
    const view: TableAction<ReturListRow> = { icon: <Eye size={16} />, title: "Detail", onClick: () => goRow(item.id, `/vendor/retur/${item.id}`), variant: "default", loading: (it) => pendingId === it.id };
    if (item.status === "draft") {
      return [
        view,
        { icon: <Pencil size={16} />, title: "Edit", onClick: () => goRow(item.id, `/vendor/retur/${item.id}/edit`), variant: "default", loading: (it) => pendingId === it.id },
        { icon: <Trash2 size={16} />, title: "Hapus", onClick: () => setDeleteId(item.id), variant: "danger" },
      ];
    }
    return [view];
  };

  const columns: ColumnDef<ReturListRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    { key: "penugasanNomor", label: "Penugasan" },
    { key: "pihakNama", label: "Vendor / Penjahit" },
    { key: "penerimaanAsalNomor", label: "Dari Penerimaan", renderCell: (item) => item.penerimaanAsalNomor ?? "—" },
    { key: "totalPcs", label: "Pcs", align: "right" },
    { key: "biayaPerbaikan", label: "Biaya Owncrave", align: "right", renderCell: (item) => formatRupiah(item.biayaPerbaikan) },
    { key: "tanggalRetur", label: "Retur", renderCell: (item) => formatTanggal(item.tanggalRetur) },
    { key: "targetKembali", label: "Target Kembali", renderCell: (item) => formatTanggal(item.targetKembali) },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => {
        const b = RETUR_STATUS_LABEL[item.status];
        return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", b.className)}>{b.label}</span>;
      },
    },
    { key: "id", label: "Aksi", sortable: false, searchable: false, align: "center", renderCell: (item) => <TableActions item={item} actions={actionsFor(item)} /> },
  ];

  const table = useTable({ data: items, columns, defaultPageSize: 10, getRowId: (item) => item.id });

  return (
    <>
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari retur..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => go("/vendor/retur/baru")} loading={isPendingNew} className="hidden sm:inline-flex">+ Buat Retur</Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          mobileFab={
            <Button onClick={() => go("/vendor/retur/baru")} loading={isPendingNew} className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center">
              <Plus size={24} />
            </Button>
          }
        />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Retur?"
        message="Hanya retur draft yang bisa dihapus."
        confirmLabel="Hapus"
        onConfirm={() => { if (deleteId) remove.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
        loading={remove.isPending}
      />
    </>
  );
}
