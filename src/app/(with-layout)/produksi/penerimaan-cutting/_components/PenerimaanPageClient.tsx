"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Eye, Plus } from "lucide-react";
import type { PenerimaanListRow } from "@/services/penerimaan-cutting";
import { usePenerimaanList } from "@/hooks/usePenerimaanCutting";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  DataTable,
  useTable,
  ColumnDef,
  TableToolbar,
  TableSearch,
  TablePagination,
  ColumnToggle,
  TableActions,
  TableAction,
} from "@/components/ui/table";

interface Props {
  initialData: PenerimaanListRow[];
}

export function PenerimaanPageClient({ initialData }: Props) {
  const router = useRouter();
  const [, startNavigate] = useTransition();
  const { data } = usePenerimaanList();
  const items = data ?? initialData;

  const go = (path: string) => startNavigate(() => router.push(path));

  const actions: TableAction<PenerimaanListRow>[] = [
    {
      icon: <Eye size={16} />,
      title: "Detail",
      onClick: (item) => go(`/produksi/penerimaan-cutting/${item.id}`),
      variant: "default",
    },
  ];

  const columns: ColumnDef<PenerimaanListRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    { key: "poNomor", label: "PO" },
    { key: "produkNama", label: "Produk" },
    { key: "bkNomor", label: "Barang Keluar" },
    {
      key: "tanggalTerima",
      label: "Tanggal Terima",
      renderCell: (item) =>
        new Date(item.tanggalTerima).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    },
    { key: "jumlahBahan", label: "Jml Bahan", align: "center" },
    {
      key: "adaSelisih",
      label: "Kondisi",
      renderCell: (item) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            item.adaSelisih
              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
          )}
        >
          {item.adaSelisih ? "Ada Selisih" : "Sesuai"}
        </span>
      ),
    },
    {
      key: "id",
      label: "Aksi",
      sortable: false,
      searchable: false,
      align: "center",
      renderCell: (item) => <TableActions item={item} actions={actions} />,
    },
  ];

  const table = useTable({
    data: items,
    columns,
    defaultPageSize: 10,
    getRowId: (item) => item.id,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penerimaan Cutting"
        breadcrumb={[{ label: "Produksi" }, { label: "Penerimaan Cutting" }]}
      />

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari penerimaan..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => go("/produksi/penerimaan-cutting/baru")} className="hidden sm:inline-flex">
              + Catat Penerimaan
            </Button>
          </div>
        </TableToolbar>
        <DataTable
          table={table}
          showRowNumber
          mobileFab={
            <Button
              onClick={() => go("/produksi/penerimaan-cutting/baru")}
              className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center"
            >
              <Plus size={24} />
            </Button>
          }
        />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>
    </div>
  );
}
