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

type BarangMasukRow = {
  id: string;
  nomorDokumen: string;
  tanggal: Date;
  supplierNama: string | null;
  nomorInvoice: string | null;
};

interface Props {
  data: BarangMasukRow[];
}

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));

export function BarangMasukTable({ data }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPendingNew, startTransitionNew] = useTransition();

  const columns: ColumnDef<BarangMasukRow>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    {
      key: "tanggal",
      label: "Tanggal",
      renderCell: (item) => fmtDate(item.tanggal),
    },
    {
      key: "supplierNama",
      label: "Supplier",
      renderCell: (item) => item.supplierNama || "-",
    },
    {
      key: "nomorInvoice",
      label: "No. Invoice",
      renderCell: (item) => item.nomorInvoice || "-",
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
                  router.push(`/inventory/barang-masuk/${it.id}`),
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
        <TableSearch table={table} placeholder="Cari nomor / supplier..." />
        <div className="flex items-center gap-2">
          <ColumnToggle table={table} />
          <Button
            loading={isPendingNew}
            onClick={() => {
              startTransitionNew(() =>
                router.push("/inventory/barang-masuk/baru"),
              );
            }}
          >
            + Barang Masuk Baru
          </Button>
        </div>
      </TableToolbar>
      <DataTable table={table} showRowNumber />
      <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
    </div>
  );
}
