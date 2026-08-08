"use client";

import { ComboSelect } from "@/components/ui/ComboSelect";
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
import type { LaporanStokItem } from "@/services/laporan";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

interface Props {
  data: LaporanStokItem[];
  totalNilai: number;
  kategoriId: string;
  onKategoriChange: (v: string) => void;
  kategoriOptions: { id: string; nama: string }[];
}

export function LaporanStokTable({
  data,
  totalNilai,
  kategoriId,
  onKategoriChange,
  kategoriOptions,
}: Props) {
  const columns: ColumnDef<LaporanStokItem>[] = [
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama Bahan" },
    { key: "kategoriNama", label: "Kategori" },
    {
      key: "kuantitas",
      label: "Stok Qty",
      align: "right",
      renderCell: (item) =>
        `${item.kuantitas.toLocaleString("id-ID", { maximumFractionDigits: 3 })} ${item.satuanSingkatan || ""}`.trim(),
    },
    {
      key: "stokMinimum",
      label: "Stok Min",
      align: "right",
      renderCell: (item) =>
        `${item.stokMinimum.toLocaleString("id-ID", { maximumFractionDigits: 3 })} ${item.satuanSingkatan || ""}`.trim(),
    },
    {
      key: "hargaRataRata",
      label: "Harga Rata² (Rp)",
      align: "right",
      renderCell: (item) => rupiah(item.hargaRataRata),
    },
    {
      key: "nilaiPersediaan",
      label: "Nilai Persediaan",
      align: "right",
      renderCell: (item) => rupiah(item.nilaiPersediaan),
    },
    {
      key: "isKritis",
      label: "Status",
      align: "center",
      renderCell: (item) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            item.isKritis
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
          )}
        >
          {item.isKritis ? "⚠ Kritis" : "Normal"}
        </span>
      ),
    },
  ];

  const table = useTable({
    data,
    columns,
    defaultPageSize: 10,
    getRowId: (item) => item.bahanId,
  });

  function handleExport() {
    downloadCSV(
      "Laporan_Stok_Bahan",
      [
        { key: "kode", label: "Kode" },
        { key: "nama", label: "Nama Bahan" },
        { key: "kategoriNama", label: "Kategori" },
        { key: "kuantitas", label: "Stok Qty" },
        { key: "satuanSingkatan", label: "Satuan" },
        { key: "stokMinimum", label: "Stok Min" },
        { key: "hargaRataRata", label: "Harga Rata-rata (Rp)" },
        { key: "nilaiPersediaan", label: "Nilai Persediaan (Rp)" },
        {
          key: "isKritis",
          label: "Status",
          formatter: (v) => (v ? "Kritis" : "Normal"),
        },
      ],
      data,
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Filter & Summary Bar */}
      <div className="flex flex-col gap-3 rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <ComboSelect
            variant="filter"
            placeholder="Semua Kategori"
            options={[
              { label: "Semua Kategori", value: "" },
              ...kategoriOptions.map((k) => ({ label: k.nama, value: k.id })),
            ]}
            value={kategoriId || null}
            onChange={(v) => onKategoriChange((v as string) ?? "")}
            className="w-full sm:w-40"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-4">
          <div className="leading-tight flex flex-col justify-center">
            <span className="block text-xs font-medium text-dark-5 dark:text-dark-6">Total Nilai Persediaan</span>
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
            <TableSearch table={table} placeholder="Cari bahan / kode..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
        </TableToolbar>
        <DataTable table={table} showRowNumber />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>
    </div>
  );
}
