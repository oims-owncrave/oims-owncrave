"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useWipCutting, useRingkasanProduksi } from "@/hooks/useWip";
import type { WipRow, RingkasanProduksi } from "@/services/wip";
import type { WipStatus } from "@/lib/wip-status";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  DataTable,
  useTable,
  ColumnDef,
  TableToolbar,
  TableSearch,
  TablePagination,
  ColumnToggle,
} from "@/components/ui/table";

interface Props {
  initialRows: WipRow[];
  initialRingkasan: RingkasanProduksi;
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const WIP_BADGE: Record<WipStatus, string> = {
  menunggu_bahan: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  menunggu_diterima: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  menunggu_wo: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  sedang_cutting: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  cutting_selesai: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  sedang_bundling: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  siap_dikirim: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-dark dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

export function WipPageClient({ initialRows, initialRingkasan }: Props) {
  const { data: rows } = useWipCutting();
  const { data: ringkasan } = useRingkasanProduksi();

  const items = rows ?? initialRows;
  const r = ringkasan ?? initialRingkasan;

  const poAktif = items.length;
  const menungguBahan = items.filter((i) => i.status === "menunggu_bahan").length;
  const sedangCutting = items.filter((i) =>
    ["sedang_cutting", "cutting_selesai", "sedang_bundling"].includes(i.status),
  ).length;
  const terlambat = items.filter((i) => i.terlambat).length;

  const columns: ColumnDef<WipRow>[] = [
    {
      key: "nomorDokumen",
      label: "PO",
      renderCell: (item) => (
        <Link href={`/produksi/po/${item.poId}`} className="font-medium text-primary hover:underline">
          {item.nomorDokumen}
        </Link>
      ),
    },
    { key: "produkNama", label: "Produk" },
    { key: "totalTarget", label: "Target", align: "center" },
    {
      key: "baik",
      label: "Hasil Baik",
      align: "center",
      renderCell: (item) => `${item.baik}/${item.totalTarget}`,
    },
    {
      key: "dibundel",
      label: "Dibundel",
      align: "center",
      renderCell: (item) => `${item.dibundel}/${item.baik}`,
    },
    {
      key: "label",
      label: "Status WIP",
      renderCell: (item) => (
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", WIP_BADGE[item.status])}>
          {item.label}
        </span>
      ),
    },
    {
      key: "umurHari",
      label: "Umur",
      align: "center",
      renderCell: (item) => (
        <span className={cn(item.terlambat && "font-semibold text-red-600 dark:text-red-300")}>
          {item.umurHari} hari{item.terlambat ? " · terlambat" : ""}
        </span>
      ),
    },
  ];

  const table = useTable({
    data: items,
    columns,
    defaultPageSize: 25,
    getRowId: (item) => item.poId,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="WIP Produksi"
        breadcrumb={[{ label: "Produksi" }, { label: "WIP" }]}
      />

      <div className="grid grid-cols-2 gap-4 min-[850px]:grid-cols-4">
        <StatCard label="PO Aktif" value={String(poAktif)} sub={terlambat > 0 ? `${terlambat} terlambat` : undefined} />
        <StatCard label="Menunggu Bahan" value={String(menungguBahan)} sub={`${sedangCutting} sedang cutting/bundling`} />
        <StatCard
          label="Hasil Bulan Ini"
          value={`${r.hasilBaikBulanIni} pcs`}
          sub={r.hasilRusakBulanIni > 0 ? `${r.hasilRusakBulanIni} rusak` : undefined}
        />
        <StatCard
          label="Bundel Siap Kirim"
          value={String(r.bundelSiapKirim)}
          sub={r.nilaiLimbahBulanIni > 0 ? `Limbah: ${rupiah(r.nilaiLimbahBulanIni)}` : undefined}
        />
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari PO..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
        </TableToolbar>
        <DataTable table={table} showRowNumber />
        <TablePagination table={table} pageSizeOptions={[25, 50]} />
      </div>
    </div>
  );
}
