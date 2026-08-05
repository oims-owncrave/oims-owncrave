"use client";

import { ComboSelect } from "@/components/ui/ComboSelect";
import { DateInput } from "@/components/ui/DateInput";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  useTable,
  ColumnDef,
  TableToolbar,
  TableSearch,
  TablePagination,
  ColumnToggle,
} from "@/components/ui/table";
import { downloadCSV } from "@/lib/export-csv";
import type { MutasiRow } from "@/services/mutasi";

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));

const TIPE_CONFIG = {
  masuk: {
    label: "Masuk",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  keluar: {
    label: "Keluar",
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  penyesuaian: {
    label: "Penyesuaian",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  retur_masuk: {
    label: "Retur Masuk",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
} as const;

interface Props {
  data: MutasiRow[];
  from: string;
  to: string;
  bahanId: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onBahanChange: (v: string) => void;
  bahanOptions: { id: string; kode: string; nama: string }[];
}

export function LaporanMutasiTable({
  data,
  from,
  to,
  bahanId,
  onFromChange,
  onToChange,
  onBahanChange,
  bahanOptions,
}: Props) {
  const columns: ColumnDef<MutasiRow>[] = [
    {
      key: "createdAt",
      label: "Waktu",
      renderCell: (item) => fmtDate(item.createdAt),
    },
    {
      key: "bahanNama",
      label: "Bahan",
      renderCell: (item) => (
        <span>
          <span className="font-mono text-xs text-dark-5 dark:text-dark-6">
            {item.bahanKode}
          </span>{" "}
          {item.bahanNama}
        </span>
      ),
    },
    {
      key: "tipe",
      label: "Tipe",
      renderCell: (item) => {
        const cfg = TIPE_CONFIG[item.tipe] ?? { label: item.tipe, cls: "" };
        return (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", cfg.cls)}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "kuantitas",
      label: "Kuantitas",
      align: "right",
      renderCell: (item) => {
        const qty = Number(item.kuantitas);
        const isNeg = qty < 0;
        return (
          <span
            className={cn(
              "font-mono font-medium",
              isNeg
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400",
            )}
          >
            {isNeg ? "" : "+"}
            {qty.toLocaleString("id-ID", { maximumFractionDigits: 3 })}{" "}
            {item.satuanSingkatan || ""}
          </span>
        );
      },
    },
    {
      key: "nomorDokumen",
      label: "Dokumen Sumber",
      renderCell: (item) => item.nomorDokumen || "-",
    },
    { key: "createdByNama", label: "Dibuat Oleh" },
  ];

  const table = useTable({
    data,
    columns,
    defaultPageSize: 10,
    getRowId: (item) => item.id,
  });

  function handleExport() {
    downloadCSV(
      `Laporan_Mutasi_Stok_${from || "semua"}_-_${to || "semua"}`,
      [
        {
          key: "createdAt",
          label: "Waktu",
          formatter: (v) => fmtDate(new Date(v)),
        },
        { key: "bahanKode", label: "Kode Bahan" },
        { key: "bahanNama", label: "Nama Bahan" },
        { key: "tipe", label: "Tipe Mutasi" },
        { key: "kuantitas", label: "Kuantitas" },
        { key: "satuanSingkatan", label: "Satuan" },
        { key: "nomorDokumen", label: "Dokumen Sumber" },
        { key: "createdByNama", label: "Dibuat Oleh" },
      ],
      data,
    );
  }

  return (
    <div className="space-y-4">
      {/* Date & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <ComboSelect
            variant="filter"
            placeholder="Semua Bahan"
            options={[
              { label: "Semua Bahan", value: "" },
              ...bahanOptions.map((b) => ({
                label: `${b.kode} — ${b.nama}`,
                value: b.id,
              })),
            ]}
            value={bahanId || null}
            onChange={(v) => onBahanChange((v as string) ?? "")}
            className="w-full sm:w-40"
          />
          <div className="flex items-center gap-2">
            <DateInput value={from} onChange={onFromChange} placeholder="Dari Tanggal" containerClassName="flex-1" className="w-full" />
            <DateInput value={to} onChange={onToChange} placeholder="Sampai Tanggal" containerClassName="flex-1" className="w-full" />
          </div>
        </div>

        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary/5 dark:border-primary dark:text-white w-full sm:w-auto"
          onClick={handleExport}
        >
          <Download size={16} className="mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table container matching master pattern */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <TableSearch table={table} placeholder="Cari bahan / dokumen..." />
          <ColumnToggle table={table} className="w-full sm:w-auto justify-center" />
        </TableToolbar>
        <DataTable table={table} showRowNumber />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>
    </div>
  );
}
