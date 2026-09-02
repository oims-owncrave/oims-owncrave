"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Eye, Printer, Plus } from "lucide-react";
import { usePengirimanList } from "@/hooks/usePengirimanJahit";
import type { PengirimanListRow } from "@/services/pengiriman-jahit";
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
  initialData: PengirimanListRow[];
}

export function PengirimanTable({ initialData }: Props) {
  const router = useRouter();
  const [, startNavigate] = useTransition();
  const { data } = usePengirimanList();
  const items = data ?? initialData;
  const go = (path: string) => startNavigate(() => router.push(path));

  const actions: TableAction<PengirimanListRow>[] = [
    { icon: <Eye size={16} />, title: "Detail", onClick: (item) => go(`/vendor/pengiriman/${item.id}`), variant: "default" },
    { icon: <Printer size={16} />, title: "Surat Jalan", onClick: (item) => go(`/vendor/pengiriman/${item.id}/surat-jalan`), variant: "default" },
  ];

  const columns: ColumnDef<PengirimanListRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    { key: "sjNomor", label: "Surat Jalan", renderCell: (item) => item.sjNomor ?? "—" },
    { key: "penugasanNomor", label: "Penugasan" },
    { key: "poNomor", label: "PO" },
    { key: "pihakNama", label: "Vendor / Penjahit" },
    {
      key: "totalPcs",
      label: "Bundel / Pcs",
      align: "right",
      renderCell: (item) => <span className="whitespace-nowrap">{item.totalBundel} bdl · {item.totalPcs} pcs</span>,
    },
    { key: "tanggalJam", label: "Dikirim", renderCell: (item) => formatTanggal(item.tanggalJam, true) },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => {
        const b = PENGIRIMAN_STATUS_LABEL[item.status];
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
          <TableSearch table={table} placeholder="Cari pengiriman..." className="flex-1 sm:w-64" />
          <ColumnToggle table={table} className="shrink-0" />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => go("/vendor/pengiriman/baru")} className="hidden sm:inline-flex">+ Buat Pengiriman</Button>
        </div>
      </TableToolbar>
      <DataTable
        table={table}
        showRowNumber
        mobileFab={
          <Button onClick={() => go("/vendor/pengiriman/baru")} className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center">
            <Plus size={24} />
          </Button>
        }
      />
      <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
    </div>
  );
}
