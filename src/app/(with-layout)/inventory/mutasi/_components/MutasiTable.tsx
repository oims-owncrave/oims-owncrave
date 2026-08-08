"use client";

import { cn } from "@/lib/utils";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { DateInput } from "@/components/ui/DateInput";
import {
  DataTable,
  useTable,
  ColumnDef,
  TableToolbar,
  TableSearch,
  TablePagination,
  ColumnToggle,
} from "@/components/ui/table";
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
  // Pagination
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  // Filter state (untuk tampilkan nilai filter yang aktif)
  filterBahanLabel: string;
  filterTipe: string;
  filterFrom: string;
  filterTo: string;
  onFilterBahanChange: (id: string, label: string) => void;
  onFilterTipeChange: (v: string) => void;
  onFilterFromChange: (v: string) => void;
  onFilterToChange: (v: string) => void;
  bahanOptions: { id: string; kode: string; nama: string }[];
}

export function MutasiTable({
  data,
  page,
  total,
  pageSize,
  onPageChange,
  filterBahanLabel,
  filterTipe,
  filterFrom,
  filterTo,
  onFilterBahanChange,
  onFilterTipeChange,
  onFilterFromChange,
  onFilterToChange,
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
      sortable: false,
      searchable: false,
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
      searchable: false,
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
      renderCell: (item) => item.nomorDokumen || <span className="text-dark-5 dark:text-dark-6">—</span>,
    },
    {
      key: "createdByNama",
      label: "Dibuat Oleh",
    },
  ];

  const table = useTable({
    data,
    columns,
    defaultPageSize: pageSize,
    getRowId: (item) => item.id,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Tabel */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex flex-col gap-3 w-full lg:flex-row lg:flex-wrap lg:items-center lg:w-auto">
            {/* Row 1 mobile: Search + ColumnToggle */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <TableSearch table={table} placeholder="Cari bahan / dokumen..." className="flex-1 sm:w-64" />
              <ColumnToggle table={table} className="shrink-0 lg:hidden" />
            </div>

            {/* Row 2 mobile: Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <ComboSelect
                variant="filter"
                placeholder="Semua bahan"
                options={[
                  { label: "Semua bahan", value: "" },
                  ...bahanOptions.map((b) => ({ label: `${b.kode} — ${b.nama}`, value: b.id })),
                ]}
                value={filterBahanLabel || null}
                onChange={(v) => {
                  const id = (v as string) ?? "";
                  const opt = bahanOptions.find((b) => b.id === id);
                  onFilterBahanChange(id, opt ? `${opt.kode} — ${opt.nama}` : "");
                }}
                className="flex-1 sm:w-48 sm:flex-none"
              />
              <ComboSelect
                variant="filter"
                placeholder="Semua tipe"
                options={[
                  { label: "Semua tipe", value: "" },
                  { label: "Masuk", value: "masuk" },
                  { label: "Keluar", value: "keluar" },
                  { label: "Penyesuaian", value: "penyesuaian" },
                  { label: "Retur Masuk", value: "retur_masuk" },
                ]}
                value={filterTipe || null}
                onChange={(v) => onFilterTipeChange((v as string) ?? "")}
                className="flex-1 sm:w-36 sm:flex-none"
              />
              <DateInput value={filterFrom} onChange={onFilterFromChange} placeholder="Dari Tanggal" containerClassName="flex-1 sm:w-36 sm:flex-none" className="w-full" />
              <DateInput value={filterTo} onChange={onFilterToChange} placeholder="Sampai Tanggal" containerClassName="flex-1 sm:w-36 sm:flex-none" className="w-full" />
            </div>
          </div>
          <ColumnToggle table={table} className="hidden lg:flex shrink-0 justify-center" />
        </TableToolbar>
        <DataTable table={table} showRowNumber />
        <TablePagination table={table} pageSizeOptions={[25, 50, 100]} />
      </div>

      {/* Server pagination (untuk data besar lintas halaman) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-sm text-dark-5 dark:text-dark-6">
          <span>
            Halaman {page} dari {totalPages} ({total} entri)
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-stroke px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-dark-3 dark:hover:bg-dark-2"
            >
              ← Sebelumnya
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-stroke px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-dark-3 dark:hover:bg-dark-2"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
