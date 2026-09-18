"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { useWoList, useWoMutation } from "@/hooks/useWoCutting";
import type { WoListRow } from "@/services/wo-cutting";
import { WO_STATUS_BADGE } from "./wo-status";
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
  initialData: WoListRow[];
}

export function WoTable({ initialData }: Props) {
  const router = useRouter();
  const [isPendingNew, startTransitionNew] = useTransition();
  const [, startNavigate] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { data } = useWoList();
  const { remove } = useWoMutation();
  const items = data ?? initialData;

  const go = (path: string) => startTransitionNew(() => router.push(path));
  const goRow = (id: string, path: string) => {
    setPendingId(id);
    startNavigate(() => router.push(path));
  };

  const actionsFor = (item: WoListRow): TableAction<WoListRow>[] => {
    const view: TableAction<WoListRow> = {
      icon: <Eye size={16} />,
      title: "Detail",
      onClick: () => goRow(item.id, `/produksi/wo-cutting/${item.id}`),
      variant: "default",
      loading: (it) => pendingId === it.id,
    };
    if (item.status === "draft") {
      return [
        view,
        {
          icon: <Pencil size={16} />,
          title: "Edit",
          onClick: () => goRow(item.id, `/produksi/wo-cutting/${item.id}/edit`),
          variant: "default",
          loading: (it) => pendingId === it.id,
        },
        {
          icon: <Trash2 size={16} />,
          title: "Hapus",
          onClick: () => setDeleteId(item.id),
          variant: "danger",
        },
      ];
    }
    return [view];
  };

  const columns: ColumnDef<WoListRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    { key: "poNomor", label: "PO" },
    { key: "produkNama", label: "Produk" },
    {
      key: "picNama",
      label: "PIC",
      renderCell: (item) => item.picNama ?? "—",
    },
    {
      key: "totalTarget",
      label: "Progres",
      renderCell: (item) => (
        <span className="whitespace-nowrap">
          {item.totalBaik}/{item.totalTarget} pcs
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => {
        const badge = WO_STATUS_BADGE[item.status];
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

  const table = useTable({
    data: items,
    columns,
    defaultPageSize: 10,
    getRowId: (item) => item.id,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari WO..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => go("/produksi/wo-cutting/baru")} loading={isPendingNew} className="hidden sm:inline-flex">
              + Buat WO
            </Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          getRowLoading={(item) => item.id === pendingId}
          mobileFab={
            <Button
              onClick={() => go("/produksi/wo-cutting/baru")}
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
        title="Hapus WO?"
        message="Hanya WO draft yang bisa dihapus."
        confirmLabel="Hapus"
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        loading={remove.isPending}
      />
    </div>
  );
}
