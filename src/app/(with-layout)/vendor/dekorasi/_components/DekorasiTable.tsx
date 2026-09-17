"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatRupiah, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Eye, Printer, Plus } from "lucide-react";
import { usePekerjaanDekorasiList } from "@/hooks/useDekorasi";
import type { PekerjaanDekorasiListRow } from "@/services/dekorasi";
import { DEKORASI_STATUS_LABEL, DEKORASI_JENIS_LABEL, DEKORASI_POSISI_LABEL } from "@/lib/schemas/dekorasi";
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
  initialData: PekerjaanDekorasiListRow[];
}

export function DekorasiTable({ initialData }: Props) {
  const router = useRouter();
  const [isPendingNew, startTransitionNew] = useTransition();
  const [, startNavigate] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { data } = usePekerjaanDekorasiList();
  const items = data ?? initialData;
  const go = (path: string) => startTransitionNew(() => router.push(path));
  const goRow = (id: string, path: string) => {
    setPendingId(id);
    startNavigate(() => router.push(path));
  };

  const actionsFor = (item: PekerjaanDekorasiListRow): TableAction<PekerjaanDekorasiListRow>[] => {
    const a: TableAction<PekerjaanDekorasiListRow>[] = [
      { icon: <Eye size={16} />, title: "Detail", onClick: () => goRow(item.id, `/vendor/dekorasi/${item.id}`), variant: "default", loading: (it) => pendingId === it.id },
    ];
    if (item.sjNomor) {
      a.push({ icon: <Printer size={16} />, title: "Surat Jalan", onClick: () => goRow(item.id, `/vendor/dekorasi/${item.id}/surat-jalan`), variant: "default", loading: (it) => pendingId === it.id });
    }
    return a;
  };

  const columns: ColumnDef<PekerjaanDekorasiListRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    { key: "woNomor", label: "WO Cutting" },
    { key: "poNomor", label: "PO" },
    { key: "produkNama", label: "Produk" },
    {
      key: "jenis",
      label: "Dekorasi",
      renderCell: (item) => (
        <span className="whitespace-nowrap">
          {DEKORASI_JENIS_LABEL[item.jenis]}
          <span className="ml-1 text-xs text-dark-5 dark:text-dark-6">{DEKORASI_POSISI_LABEL[item.posisi]}</span>
        </span>
      ),
    },
    { key: "vendorNama", label: "Vendor" },
    {
      key: "selesai",
      label: "Progres",
      align: "right",
      renderCell: (item) => (
        <span className="whitespace-nowrap">
          {item.selesai}/{item.jumlah}
          {item.rusak > 0 && <span className="ml-1 text-xs text-red-600 dark:text-red-400">({item.rusak} rusak)</span>}
        </span>
      ),
    },
    { key: "tarifSnapshot", label: "Tagihan", align: "right", renderCell: (item) => formatRupiah(item.selesai * Number(item.tarifSnapshot)) },
    { key: "targetSelesai", label: "Target", renderCell: (item) => formatTanggal(item.targetSelesai) },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => {
        const b = DEKORASI_STATUS_LABEL[item.status];
        const label = item.status === "dikirim" && item.selesai > 0 ? `Selesai sebagian · ${item.selesai}/${item.jumlah}` : b.label;
        return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", b.className)}>{label}</span>;
      },
    },
    { key: "id", label: "Aksi", sortable: false, searchable: false, align: "center", renderCell: (item) => <TableActions item={item} actions={actionsFor(item)} /> },
  ];

  const table = useTable({ data: items, columns, defaultPageSize: 10, getRowId: (item) => item.id });

  return (
    <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
      <TableToolbar>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <TableSearch table={table} placeholder="Cari pekerjaan..." className="flex-1 sm:w-64" />
          <ColumnToggle table={table} className="shrink-0" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => go("/vendor/dekorasi/template")} loading={isPendingNew} className="hidden sm:inline-flex">Template</Button>
          <Button onClick={() => go("/vendor/dekorasi/baru")} loading={isPendingNew} className="hidden sm:inline-flex">+ Buat Pekerjaan</Button>
        </div>
      </TableToolbar>
      <DataTable
        table={table}
        showRowNumber
        mobileFab={
          <Button onClick={() => go("/vendor/dekorasi/baru")} loading={isPendingNew} className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center">
            <Plus size={24} />
          </Button>
        }
      />
      <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
    </div>
  );
}
