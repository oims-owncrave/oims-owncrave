"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatRupiah, formatTanggal } from "@/lib/utils";
import { Eye } from "lucide-react";
import { useWipJahit, useRingkasanJahit } from "@/hooks/useWipJahit";
import type { WipJahitRow, RingkasanJahit } from "@/services/wip-jahit";
import { WIP_JAHIT_LABEL } from "@/lib/jahit/wip-status";
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
  initialRows: WipJahitRow[];
  initialRingkasan: RingkasanJahit;
}

function Kartu({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: "warn" | "danger" | "ok" }) {
  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      <p className="text-xs text-dark-5 dark:text-dark-6">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
          tone === "danger" && "text-red-600 dark:text-red-400",
          tone === "ok" && "text-green-600 dark:text-green-400",
          !tone && "text-dark dark:text-white",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{hint}</p>}
    </div>
  );
}

export function WipJahitClient({ initialRows, initialRingkasan }: Props) {
  const router = useRouter();
  const [, startNavigate] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { data: rows } = useWipJahit();
  const { data: ringkasan } = useRingkasanJahit();
  const items = rows ?? initialRows;
  const r = ringkasan ?? initialRingkasan;
  const goRow = (id: string, path: string) => {
    setPendingId(id);
    startNavigate(() => router.push(path));
  };

  const actions: TableAction<WipJahitRow>[] = [
    { icon: <Eye size={16} />, title: "Detail penugasan", onClick: (item) => goRow(item.penugasanId, `/vendor/penugasan/${item.penugasanId}`), variant: "default", loading: (item) => pendingId === item.penugasanId },
  ];

  const columns: ColumnDef<WipJahitRow>[] = [
    { key: "nomorDokumen", label: "Penugasan" },
    { key: "poNomor", label: "PO" },
    { key: "produkNama", label: "Produk" },
    {
      key: "pihakNama",
      label: "Dikerjakan",
      renderCell: (item) => (
        <span className="whitespace-nowrap">
          {item.pihakNama}
          <span className="ml-1 text-xs text-dark-5 dark:text-dark-6">{item.internal ? "internal" : "vendor"}</span>
        </span>
      ),
    },
    { key: "dikirim", label: "Dikirim", align: "right" },
    { key: "baik", label: "Selesai", align: "right" },
    {
      key: "sisa",
      label: "Sisa WIP",
      align: "right",
      renderCell: (item) => <span className={cn("font-semibold", item.sisa > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400")}>{item.sisa}</span>,
    },
    {
      key: "progres",
      label: "Progres",
      align: "right",
      renderCell: (item) => (
        <div className="flex items-center justify-end gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, item.progres)}%` }} />
          </div>
          <span className="w-9 text-right text-xs">{item.progres}%</span>
        </div>
      ),
    },
    { key: "tanggalKirim", label: "Dikirim Tgl", renderCell: (item) => formatTanggal(item.tanggalKirim) },
    { key: "umurHari", label: "Umur", align: "right", renderCell: (item) => (item.umurHari != null ? `${item.umurHari} hr` : "—") },
    { key: "targetSelesai", label: "Target", renderCell: (item) => formatTanggal(item.targetSelesai) },
    {
      key: "terlambatHari",
      label: "Telat",
      align: "right",
      renderCell: (item) => (item.terlambatHari > 0 ? <span className="font-medium text-red-600 dark:text-red-400">{item.terlambatHari} hr</span> : "—"),
    },
    { key: "estimasiBiaya", label: "Estimasi Biaya", align: "right", renderCell: (item) => formatRupiah(item.estimasiBiaya) },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => {
        const b = WIP_JAHIT_LABEL[item.status];
        return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", b.className)}>{b.label}</span>;
      },
    },
    {
      key: "penugasanId",
      label: "Aksi",
      sortable: false,
      searchable: false,
      align: "center",
      renderCell: (item) => <TableActions item={item} actions={actions} />,
    },
  ];

  const table = useTable({ data: items, columns, defaultPageSize: 10, getRowId: (item) => item.penugasanId });

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kartu label="Total WIP Jahit" value={`${r.totalWip} pcs`} hint={`${r.penugasanAktif} penugasan aktif`} />
        <Kartu label="WIP Internal" value={`${r.wipInternal} pcs`} />
        <Kartu label="WIP Vendor" value={`${r.wipVendor} pcs`} />
        <Kartu label="Estimasi Biaya Aktif" value={formatRupiah(r.estimasiBiayaAktif)} />
        <Kartu label="Mendekati Deadline" value={r.mendekatiDeadline} hint="≤ 3 hari lagi" tone={r.mendekatiDeadline > 0 ? "warn" : undefined} />
        <Kartu label="Terlambat" value={r.terlambat} tone={r.terlambat > 0 ? "danger" : undefined} />
        <Kartu label="Retur Terbuka" value={r.returTerbuka} tone={r.returTerbuka > 0 ? "warn" : undefined} />
        <Kartu label="Diterima Bulan Ini" value={`${r.diterimaBulanIni} pcs`} tone="ok" hint={`${r.bundelBelumDitugaskan} bundel belum ditugaskan`} />
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari penugasan..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div />
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          getRowLoading={(item) => item.penugasanId === pendingId}
        />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>
    </>
  );
}
