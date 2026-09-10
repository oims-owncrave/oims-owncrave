"use client";

import { useState } from "react";
import { cn, formatTanggal } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Trash2 } from "lucide-react";
import { QC_PRIORITAS_LABEL, type QcPrioritas } from "@/lib/qc/prioritas";
import { usePenerimaanQcMutation } from "@/hooks/usePenerimaanQc";
import type { listPenerimaanQc } from "@/services/penerimaan-qc";
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

type Row = Awaited<ReturnType<typeof listPenerimaanQc>>[number];

interface Props {
  data: Row[];
}

export function PenerimaanQcTable({ data }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { remove } = usePenerimaanQcMutation();

  const actions: TableAction<Row>[] = [
    {
      icon: <Trash2 size={16} />,
      title: "Hapus",
      onClick: (item) => setDeleteId(item.id),
      variant: "danger",
    },
  ];

  const columns: ColumnDef<Row>[] = [
    { key: "nomorDokumen", label: "Nomor" },
    {
      key: "tanggal",
      label: "Tanggal",
      renderCell: (r) => formatTanggal(r.tanggal),
    },
    { key: "nomorPo", label: "PO", renderCell: (r) => r.nomorPo || "—" },
    {
      key: "vendorNama",
      label: "Vendor",
      renderCell: (r) => r.vendorNama || "Internal",
    },
    { key: "nomorPenerimaanHasil", label: "Dari Penerimaan" },
    {
      key: "totalPcs",
      label: "Total Pcs",
      align: "right",
      renderCell: (r) => Number(r.totalPcs),
    },
    {
      key: "prioritas",
      label: "Prioritas",
      renderCell: (r) => {
        const p = QC_PRIORITAS_LABEL[r.prioritas as QcPrioritas];
        return (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", p?.className)}>
            {p?.label ?? r.prioritas}
          </span>
        );
      },
    },
    {
      key: "targetSelesai",
      label: "Target Selesai",
      renderCell: (r) => formatTanggal(r.targetSelesai),
    },
    { key: "penerima", label: "Penerima" },
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
    data,
    columns,
    defaultPageSize: 25,
    getRowId: (r) => r.id,
  });

  return (
    <>
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch
              table={table}
              placeholder="Cari nomor / PO / vendor..."
              className="flex-1 sm:w-72"
            />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
        </TableToolbar>
        <DataTable table={table} showRowNumber />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Penerimaan QC?"
        message="Barang kembali ke antrean QC. Dokumen yang sudah masuk Work Order QC tidak boleh dihapus."
        confirmLabel="Hapus"
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        loading={remove.isPending}
      />
    </>
  );
}
