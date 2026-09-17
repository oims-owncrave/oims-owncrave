"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatTanggal } from "@/lib/utils";
import { Eye, Printer } from "lucide-react";
import { useSuratJalanList } from "@/hooks/usePengirimanJahit";
import type { SuratJalanListRow } from "@/services/pengiriman-jahit";
import { PENGIRIMAN_STATUS_LABEL } from "@/lib/schemas/pengiriman-jahit";
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
  initialData: SuratJalanListRow[];
}

export function SuratJalanTable({ initialData }: Props) {
  const router = useRouter();
  const [, startNavigate] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { data } = useSuratJalanList();
  const items = data ?? initialData;
  const goRow = (id: string, path: string) => {
    setPendingId(id);
    startNavigate(() => router.push(path));
  };

  const actions: TableAction<SuratJalanListRow>[] = [
    { icon: <Printer size={16} />, title: "Cetak", onClick: (item) => goRow(item.id, `/vendor/pengiriman/${item.pengirimanId}/surat-jalan`), variant: "default", loading: (item) => pendingId === item.id },
    { icon: <Eye size={16} />, title: "Pengiriman", onClick: (item) => goRow(item.id, `/vendor/pengiriman/${item.pengirimanId}`), variant: "default", loading: (item) => pendingId === item.id },
  ];

  const columns: ColumnDef<SuratJalanListRow>[] = [
    { key: "nomorDokumen", label: "Nomor SJ" },
    { key: "pengirimanNomor", label: "Pengiriman" },
    { key: "penugasanNomor", label: "Penugasan" },
    { key: "poNomor", label: "PO" },
    { key: "pihakNama", label: "Tujuan" },
    { key: "tanggalJam", label: "Tanggal", renderCell: (item) => formatTanggal(item.tanggalJam, true) },
    {
      key: "jumlahCetak",
      label: "Cetak",
      align: "center",
      renderCell: (item) => (item.jumlahCetak > 0 ? `${item.jumlahCetak}×` : "Belum"),
    },
    {
      key: "pengirimanStatus",
      label: "Status",
      renderCell: (item) => {
        const b = PENGIRIMAN_STATUS_LABEL[item.pengirimanStatus];
        return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", b.className)}>{b.label}</span>;
      },
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
          <TableSearch table={table} placeholder="Cari surat jalan..." className="flex-1 sm:w-64" />
          <ColumnToggle table={table} className="shrink-0" />
        </div>
        <div />
      </TableToolbar>
      <DataTable table={table} showRowNumber />
      <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
    </div>
  );
}
