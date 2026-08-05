"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  useTable,
  ColumnDef,
  TableToolbar,
  TableSearch,
  TablePagination,
  TableActions,
  ColumnToggle,
} from "@/components/ui/table";

type BarangKeluarRow = {
  id: string;
  nomorDokumen: string;
  tanggal: Date;
  tujuan: string | null;
};

interface Props {
  data: BarangKeluarRow[];
}

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));

export function BarangKeluarTable({ data }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPendingNew, startTransitionNew] = useTransition();

  const columns: ColumnDef<BarangKeluarRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
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
      key: "id",
      label: "Aksi",
      sortable: false,
      searchable: false,
      align: "center",
      renderCell: (item) => (
        <TableActions
          item={item}
          actions={[
            {
              icon: <Eye size={16} />,
              title: "Lihat detail",
              loading: (it) => isPending && pendingId === it.id,
              onClick: (it) => {
                setPendingId(it.id);
                startTransition(() =>
                  router.push(`/inventory/barang-keluar/${it.id}`),
                );
              },
            },
          ]}
        />
      ),
    },
  ];

  const table = useTable({
    data,
    columns,
    defaultPageSize: 10,
    getRowId: (item) => item.id,
  });

  return (
    <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
      <TableToolbar>
        <TableSearch table={table} placeholder="Cari nomor / tujuan..." />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ColumnToggle table={table} className="flex-1 sm:flex-none justify-center" />
          <Button
            loading={isPendingNew}
            className="flex-1 sm:flex-none"
            onClick={() => {
              startTransitionNew(() =>
                router.push("/inventory/barang-keluar/baru"),
              );
            }}
          >
            + Barang Keluar Baru
          </Button>
        </div>
      </TableToolbar>
      <DataTable table={table} showRowNumber />
      <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
    </div>
  );
}
