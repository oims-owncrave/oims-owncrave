"use client";

import { cn, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Send } from "lucide-react";
import { umurAntrean } from "@/lib/qc/prioritas";
import type { AntreanQcRow } from "@/services/penerimaan-qc";
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
  data: AntreanQcRow[];
  onKirim: (penerimaanHasilId: string) => void;
}

export function AntreanQcTable({ data, onKirim }: Props) {
  const columns: ColumnDef<AntreanQcRow>[] = [
    { key: "nomorPo", label: "PO" },
    { key: "bundelNomor", label: "Bundel" },
    { key: "produkNama", label: "Produk" },
    { key: "sku", label: "SKU" },
    { key: "warnaNama", label: "Warna" },
    { key: "ukuran", label: "Ukuran" },
    { key: "pihakNama", label: "Vendor / Penjahit" },
    {
      key: "jumlahBaik",
      label: "Baik Visual",
      align: "right",
      renderCell: (r) => r.jumlahBaik,
    },
    {
      key: "sudahKeQc",
      label: "Sudah ke QC",
      align: "right",
      renderCell: (r) => Number(r.sudahKeQc),
    },
    {
      key: "sisa",
      label: "Sisa Siap QC",
      align: "right",
      renderCell: (r) => (
        <span className="font-semibold text-dark dark:text-white">{r.sisa}</span>
      ),
    },
    {
      key: "tanggalTerima",
      label: "Tanggal Terima",
      renderCell: (r) => formatTanggal(r.tanggalTerima),
    },
    {
      key: "penerimaanHasilId",
      label: "Umur",
      align: "right",
      renderCell: (r) => {
        const hari = umurAntrean(r.tanggalTerima);
        return (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              hari >= 7
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                : hari >= 3
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
            )}
          >
            {hari} hari
          </span>
        );
      },
    },
    {
      key: "penerimaanHasilDetailId",
      label: "Aksi",
      sortable: false,
      searchable: false,
      align: "center",
      renderCell: (r) => (
        <Button
          variant="outline"
          onClick={() => onKirim(r.penerimaanHasilId)}
          className="h-8 px-3 text-xs"
        >
          <Send size={14} className="mr-1.5" /> Kirim ke QC
        </Button>
      ),
    },
  ];

  const table = useTable({
    data,
    columns,
    defaultPageSize: 25,
    getRowId: (r) => r.penerimaanHasilDetailId,
  });

  return (
    <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
      <TableToolbar>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <TableSearch
            table={table}
            placeholder="Cari PO / bundel / SKU..."
            className="flex-1 sm:w-72"
          />
          <ColumnToggle table={table} className="shrink-0" />
        </div>
      </TableToolbar>
      <DataTable table={table} showRowNumber />
      <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
    </div>
  );
}
