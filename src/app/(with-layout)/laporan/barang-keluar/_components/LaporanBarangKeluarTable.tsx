"use client";

import { DateInput } from "@/components/ui/DateInput";
import { Download } from "lucide-react";
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
import type { LaporanKeluarItem } from "@/services/laporan";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));

interface Props {
  data: LaporanKeluarItem[];
  totalKuantitas: number;
  totalNilai: number;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

export function LaporanBarangKeluarTable({
  data,
  totalKuantitas,
  totalNilai,
  from,
  to,
  onFromChange,
  onToChange,
}: Props) {
  const columns: ColumnDef<LaporanKeluarItem>[] = [
    { key: "nomorDokumen", label: "No. Dokumen" },
    {
      key: "tanggal",
      label: "Tanggal",
      renderCell: (item) => fmtDate(item.tanggal),
    },
    {
      key: "tujuan",
      label: "Tujuan",
      renderCell: (item) => item.tujuan || "-",
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
      key: "kuantitas",
      label: "Qty",
      align: "right",
      renderCell: (item) =>
        `${item.kuantitas.toLocaleString("id-ID", { maximumFractionDigits: 3 })} ${item.satuanSingkatan || ""}`.trim(),
    },
    {
      key: "hargaSatuan",
      label: "Harga Satuan",
      align: "right",
      renderCell: (item) => rupiah(item.hargaSatuan),
    },
    {
      key: "subtotal",
      label: "Subtotal",
      align: "right",
      renderCell: (item) => rupiah(item.subtotal),
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
      `Laporan_Barang_Keluar_${from || "semua"}_-_${to || "semua"}`,
      [
        { key: "nomorDokumen", label: "No. Dokumen" },
        {
          key: "tanggal",
          label: "Tanggal",
          formatter: (v) => fmtDate(new Date(v)),
        },
        { key: "tujuan", label: "Tujuan" },
        { key: "bahanKode", label: "Kode Bahan" },
        { key: "bahanNama", label: "Nama Bahan" },
        { key: "kuantitas", label: "Qty" },
        { key: "satuanSingkatan", label: "Satuan" },
        { key: "hargaSatuan", label: "Harga Satuan (Rp)" },
        { key: "subtotal", label: "Subtotal (Rp)" },
        { key: "createdByNama", label: "Dibuat Oleh" },
      ],
      data,
    );
  }

  return (
    <div className="space-y-4">
      {/* Date filter & Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <DateInput value={from} onChange={onFromChange} placeholder="Dari Tanggal" />
          <DateInput value={to} onChange={onToChange} placeholder="Sampai Tanggal" />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right leading-tight">
            <span className="block text-xs font-medium text-dark-5 dark:text-dark-6">Total Nilai Keluar</span>
            <p className="mt-0.5 text-base font-bold text-dark dark:text-white">
              {rupiah(totalNilai)}
            </p>
          </div>
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary/5 dark:border-primary dark:text-white"
            onClick={handleExport}
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table container matching master pattern */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <TableSearch table={table} placeholder="Cari dokumen / bahan / tujuan..." />
          <div className="flex items-center gap-2">
            <ColumnToggle table={table} />
          </div>
        </TableToolbar>
        <DataTable table={table} showRowNumber />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>
    </div>
  );
}
