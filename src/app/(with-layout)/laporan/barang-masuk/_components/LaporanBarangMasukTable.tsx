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
import type { LaporanMasukItem } from "@/services/laporan";

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
  data: LaporanMasukItem[];
  totalKuantitas: number;
  totalNilai: number;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

export function LaporanBarangMasukTable({
  data,
  totalKuantitas,
  totalNilai,
  from,
  to,
  onFromChange,
  onToChange,
}: Props) {
  const columns: ColumnDef<LaporanMasukItem>[] = [
    { key: "nomorDokumen", label: "No. Dokumen" },
    {
      key: "tanggal",
      label: "Tanggal",
      renderCell: (item) => fmtDate(item.tanggal),
    },
    { key: "supplierNama", label: "Supplier" },
    {
      key: "nomorInvoice",
      label: "No. Invoice",
      renderCell: (item) => item.nomorInvoice || "-",
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
      `Laporan_Barang_Masuk_${from || "semua"}_-_${to || "semua"}`,
      [
        { key: "nomorDokumen", label: "No. Dokumen" },
        {
          key: "tanggal",
          label: "Tanggal",
          formatter: (v) => fmtDate(new Date(v)),
        },
        { key: "supplierNama", label: "Supplier" },
        { key: "nomorInvoice", label: "No. Invoice" },
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
      {/* Filters card */}
      <div className="flex flex-col gap-3 rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center">
          <DateInput value={from} onChange={onFromChange} placeholder="Dari Tanggal" containerClassName="w-full sm:w-40" className="w-full" />
          <DateInput value={to} onChange={onToChange} placeholder="Sampai Tanggal" containerClassName="w-full sm:w-40" className="w-full" />
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-4">
          <div className="leading-tight flex flex-col justify-center">
            <span className="block text-xs font-medium text-dark-5 dark:text-dark-6">Total Transaksi</span>
            <p className="mt-0.5 text-base font-bold text-dark dark:text-white">
              {rupiah(totalNilai)}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary/5 dark:border-primary dark:text-white justify-center"
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari dokumen / bahan / supplier..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
        </TableToolbar>
        <DataTable table={table} showRowNumber />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>
    </div>
  );
}
