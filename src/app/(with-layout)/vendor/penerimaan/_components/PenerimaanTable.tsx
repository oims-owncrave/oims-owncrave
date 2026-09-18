"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Eye, Plus } from "lucide-react";
import { usePenerimaanHasilList } from "@/hooks/usePenerimaanHasilJahit";
import type { PenerimaanHasilListRow } from "@/services/penerimaan-hasil-jahit";
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
  initialData: PenerimaanHasilListRow[];
}

export function PenerimaanTable({ initialData }: Props) {
  const router = useRouter();
  const [isPendingNew, startTransitionNew] = useTransition();
  const [, startNavigate] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { data } = usePenerimaanHasilList();
  const items = data ?? initialData;
  const go = (path: string) => startTransitionNew(() => router.push(path));
  const goRow = (id: string, path: string) => {
    setPendingId(id);
    startNavigate(() => router.push(path));
  };

  const actions: TableAction<PenerimaanHasilListRow>[] = [
    { icon: <Eye size={16} />, title: "Detail", onClick: (item) => goRow(item.id, `/vendor/penerimaan/${item.id}`), variant: "default", loading: (item) => pendingId === item.id },
  ];

  const columns: ColumnDef<PenerimaanHasilListRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    { key: "penugasanNomor", label: "Penugasan" },
    { key: "poNomor", label: "PO" },
    { key: "pihakNama", label: "Vendor / Penjahit" },
    {
      key: "returNomor",
      label: "Jenis",
      renderCell: (item) =>
        item.returNomor ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Hasil perbaikan {item.returNomor}
          </span>
        ) : (
          <span className="text-xs text-dark-5 dark:text-dark-6">Setoran</span>
        ),
    },
    { key: "tanggalJam", label: "Diterima", renderCell: (item) => formatTanggal(item.tanggalJam, true) },
    { key: "totalBaik", label: "Baik", align: "right" },
    {
      key: "totalRusak",
      label: "Rusak",
      align: "right",
      renderCell: (item) => <span className={item.totalRusak > 0 ? "font-medium text-red-600 dark:text-red-400" : ""}>{item.totalRusak}</span>,
    },
    {
      key: "id",
      label: "Aksi",
      sortable: false,
      searchable: false,
      align: "center",
      renderCell: (item) => <TableActions item={item} actions={actions} />,
    },
  ];

  const table = useTable({ data: items, columns, defaultPageSize: 10, getRowId: (item) => item.id });

  return (
    <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
      <TableToolbar>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <TableSearch table={table} placeholder="Cari penerimaan..." className="flex-1 sm:w-64" />
          <ColumnToggle table={table} className="shrink-0" />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => go("/vendor/penerimaan/baru")} loading={isPendingNew} className="hidden sm:inline-flex">+ Catat Penerimaan</Button>
        </div>
      </TableToolbar>
      <DataTable
        table={table}
        showRowNumber
        getRowLoading={(item) => item.id === pendingId}
        mobileFab={
          <Button onClick={() => go("/vendor/penerimaan/baru")} loading={isPendingNew} className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center">
            <Plus size={24} />
          </Button>
        }
      />
      <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
    </div>
  );
}
