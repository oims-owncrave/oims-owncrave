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
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama Bahan" },
    {
      key: "kategoriNama",
      label: "Kategori",
      renderCell: (item) => item.kategoriNama || "-",
    },
    {
      key: "kuantitas",
      label: "Stok",
      align: "right",
      renderCell: (item) =>
        `${Number(item.kuantitas).toLocaleString("id-ID", { maximumFractionDigits: 3 })} ${item.satuanSingkatan || ""}`.trim(),
    },
    {
      key: "stokMinimum",
      label: "Min",
      align: "right",
      renderCell: (item) =>
        `${Number(item.stokMinimum).toLocaleString("id-ID", { maximumFractionDigits: 3 })} ${item.satuanSingkatan || ""}`.trim(),
    },
    {
      key: "nilai",
      label: "Nilai (Rp)",
      align: "right",
      renderCell: (item) => rupiah(item.nilai),
    },
    {
      key: "isKritis",
      label: "Status",
      sortable: false,
      searchable: false,
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

  const kategoriOpts = [
    { label: "Semua Kategori", value: "" },
    ...kategoriOptions.map((k) => ({ label: k.nama, value: k.id })),
  ];

  return (
    <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
      <TableToolbar>
        <div className="flex items-center gap-3">
          <TableSearch table={table} placeholder="Cari kode / nama bahan..." />
          <ComboSelect
            variant="filter"
            placeholder="Semua Kategori"
            options={kategoriOpts}
            value={kategoriId || null}
            onChange={(v) => onKategoriChange((v as string) ?? "")}
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
          />
        </div>
        <ColumnToggle table={table} />
      </TableToolbar>
      <DataTable table={table} showRowNumber />
      <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
    </div>
  );
}
