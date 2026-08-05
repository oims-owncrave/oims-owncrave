"use client";

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
import type { LaporanNilaiPersediaanKategori } from "@/services/laporan";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

interface Props {
  data: LaporanNilaiPersediaanKategori[];
  totalOverall: number;
}

export function LaporanNilaiPersediaanTable({
  data,
  totalOverall,
}: Props) {
  const columns: ColumnDef<LaporanNilaiPersediaanKategori>[] = [
    { key: "kategoriNama", label: "Kategori" },
    {
      key: "jumlahBahan",
      label: "Jumlah Jenis Bahan",
      align: "right",
      renderCell: (item) => `${item.jumlahBahan} jenis`,
    },
    {
      key: "totalNilai",
      label: "Total Nilai Persediaan",
      align: "right",
      renderCell: (item) => (
        <span className="font-semibold text-dark dark:text-white">
          {rupiah(item.totalNilai)}
        </span>
      ),
    },
    {
      key: "kontribusi",
      label: "Kontribusi (%)",
      align: "right",
      sortable: false,
      searchable: false,
      renderCell: (item) => {
        const pct = totalOverall > 0 ? (item.totalNilai / totalOverall) * 100 : 0;
        return `${pct.toFixed(1)}%`;
      },
    },
  ];

  const table = useTable({
    data,
    columns,
    defaultPageSize: 10,
    getRowId: (item) => item.kategoriId,
  });

  function handleExport() {
    downloadCSV(
      "Laporan_Nilai_Persediaan_Per_Kategori",
      [
        { key: "kategoriNama", label: "Kategori" },
        { key: "jumlahBahan", label: "Jumlah Jenis Bahan" },
        { key: "totalNilai", label: "Total Nilai Persediaan (Rp)" },
        {
          key: "totalNilai",
          label: "Kontribusi (%)",
          formatter: (v) =>
            totalOverall > 0
              ? `${((Number(v) / totalOverall) * 100).toFixed(1)}%`
              : "0%",
        },
      ],
      data,
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="flex flex-col gap-3 rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div>
          <span className="text-xs text-dark-5 dark:text-dark-6">Total Kategori</span>
          <p className="text-base font-bold text-dark dark:text-white">
            {data.length} Kategori
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="leading-tight">
            <span className="block text-xs font-medium text-dark-5 dark:text-dark-6">Total Nilai Persediaan Keseluruhan</span>
            <p className="mt-0.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {rupiah(totalOverall)}
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
          <TableSearch table={table} placeholder="Cari kategori..." />
          <ColumnToggle table={table} className="w-full sm:w-auto justify-center" />
        </TableToolbar>
        <DataTable table={table} showRowNumber />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>
    </div>
  );
}
