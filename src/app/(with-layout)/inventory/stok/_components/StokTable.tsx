"use client";

import { cn } from "@/lib/utils";
import { ComboSelect } from "@/components/ui/ComboSelect";
import {
  DataTable,
  useTable,
  ColumnDef,
  TableToolbar,
  TableSearch,
  TablePagination,
  ColumnToggle,
} from "@/components/ui/table";
import type { StokRow } from "@/services/stok";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

interface Props {
  data: StokRow[];
  onKategoriChange: (id: string) => void;
  onKritisChange: (v: string) => void;
  kategoriId: string;
  kritisOnly: string;
  kategoriOptions: { id: string; nama: string }[];
}

export function StokTable({
  data,
  onKategoriChange,
  onKritisChange,
  kategoriId,
  kritisOnly,
  kategoriOptions,
}: Props) {
  const columns: ColumnDef<StokRow>[] = [
    { key: "kode", label: "Kode", mobileRole: "detail" },
    { key: "nama", label: "Nama Bahan", mobileRole: "title" },
    {
      key: "kategoriNama",
      label: "Kategori",
      mobileRole: "detail",
      renderCell: (item) => item.kategoriNama || "-",
    },
    {
      key: "kuantitas",
      label: "Stok",
      align: "right",
      mobileRole: "highlight",
      renderCell: (item) =>
        `${Number(item.kuantitas).toLocaleString("id-ID", { maximumFractionDigits: 3 })} ${item.satuanSingkatan || ""}`.trim(),
    },
    {
      key: "stokMinimum",
      label: "Min",
      align: "right",
      mobileRole: "detail",
      renderCell: (item) =>
        `${Number(item.stokMinimum).toLocaleString("id-ID", { maximumFractionDigits: 3 })} ${item.satuanSingkatan || ""}`.trim(),
    },
    {
      key: "nilai",
      label: "Nilai (Rp)",
      align: "right",
      mobileRole: "detail",
      renderCell: (item) => rupiah(item.nilai),
    },
    {
      key: "isKritis",
      label: "Status",
      align: "center",
      mobileRole: "highlight",
      renderCell: (item) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
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

  const kategoriOpts = [
    { label: "Semua Kategori", value: "" },
    ...kategoriOptions.map((k) => ({ label: k.nama, value: k.id })),
  ];

  return (
    <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
      <TableToolbar>
        <div className="flex flex-col gap-3 w-full sm:flex-row sm:flex-wrap sm:items-center sm:w-auto">
          {/* Row 1 mobile: Search + ColumnToggle */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari kode / nama bahan..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>

          {/* Row 2 mobile: Kategori & Status filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ComboSelect
              variant="filter"
              placeholder="Semua Kategori"
              options={kategoriOpts}
              value={kategoriId || null}
              onChange={(v) => onKategoriChange((v as string) ?? "")}
              className="flex-1 sm:w-44 sm:flex-none"
            />
            <ComboSelect
              variant="filter"
              placeholder="Semua Status"
              options={[
                { label: "Semua Status", value: "" },
                { label: "Kritis", value: "kritis" },
                { label: "Normal", value: "normal" },
              ]}
              value={kritisOnly || null}
              onChange={(v) => onKritisChange((v as string) ?? "")}
              className="flex-1 sm:w-36 sm:flex-none"
            />
          </div>
        </div>
      </TableToolbar>
      <DataTable table={table} showRowNumber />
      <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
    </div>
  );
}
