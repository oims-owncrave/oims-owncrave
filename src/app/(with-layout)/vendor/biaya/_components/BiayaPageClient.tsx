"use client";

import { useState } from "react";
import { cn, formatRupiah, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Pencil, ChevronRight } from "lucide-react";
import { useBiayaList, useBiayaMutation } from "@/hooks/useBiayaJasaJahit";
import type { BiayaListRow } from "@/services/biaya-jasa-jahit";
import { BIAYA_STATUS_LABEL, BIAYA_TRANSITIONS, type BiayaStatus } from "@/lib/schemas/biaya-jasa-jahit";
import { BiayaFormModal } from "./BiayaFormModal";
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
  initialData: BiayaListRow[];
}

/** Tagihan bersih = dasar + bonus + tambahan − potongan − uang muka. */
export function hitungTagihan(r: BiayaListRow) {
  return (
    Number(r.biayaDasar) +
    Number(r.bonus ?? 0) +
    Number(r.biayaTambahan ?? 0) -
    Number(r.potongan ?? 0) -
    Number(r.uangMuka ?? 0)
  );
}

export function BiayaPageClient({ initialData }: Props) {
  const [editItem, setEditItem] = useState<BiayaListRow | null>(null);
  const { data } = useBiayaList();
  const { setStatus } = useBiayaMutation();
  const items = data ?? initialData;

  const actionsFor = (item: BiayaListRow): TableAction<BiayaListRow>[] => {
    const status = (item.status ?? "estimasi") as BiayaStatus;
    const a: TableAction<BiayaListRow>[] = [
      { icon: <Pencil size={16} />, title: "Edit komponen tagihan", onClick: () => setEditItem(item), variant: "default" },
    ];
    // aksi maju satu langkah (transisi utama, bukan ditahan/sengketa)
    const maju = BIAYA_TRANSITIONS[status].find((s) => !["ditahan", "disengketakan"].includes(s));
    if (maju) {
      a.push({
        icon: <ChevronRight size={16} />,
        title: `Lanjut ke ${BIAYA_STATUS_LABEL[maju].label}`,
        onClick: () => setStatus.mutate({ penugasanId: item.penugasanId, status: maju }),
        variant: "default",
      });
    }
    return a;
  };

  const columns: ColumnDef<BiayaListRow>[] = [
    { key: "penugasanNomor", label: "Penugasan" },
    { key: "poNomor", label: "PO" },
    { key: "pihakNama", label: "Vendor / Penjahit" },
    { key: "jumlahDiakui", label: "Diakui (pcs)", align: "right" },
    { key: "biayaDasar", label: "Biaya Dasar", align: "right", renderCell: (item) => formatRupiah(item.biayaDasar) },
    {
      key: "potongan",
      label: "Bonus / Tambahan / Potongan",
      align: "right",
      renderCell: (item) => (
        <span className="whitespace-nowrap text-xs">
          +{formatRupiah(item.bonus ?? 0)} · +{formatRupiah(item.biayaTambahan ?? 0)} · −{formatRupiah(item.potongan ?? 0)}
        </span>
      ),
    },
    {
      key: "uangMuka",
      label: "Tagihan Bersih",
      align: "right",
      renderCell: (item) => <span className="font-semibold">{formatRupiah(hitungTagihan(item))}</span>,
    },
    { key: "targetSelesai", label: "Target", renderCell: (item) => formatTanggal(item.targetSelesai) },
    {
      key: "status",
      label: "Status",
      renderCell: (item) => {
        const b = BIAYA_STATUS_LABEL[(item.status ?? "estimasi") as BiayaStatus];
        return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", b.className)}>{b.label}</span>;
      },
    },
    {
      key: "penugasanId",
      label: "Aksi",
      sortable: false,
      searchable: false,
      align: "center",
      renderCell: (item) => <TableActions item={item} actions={actionsFor(item)} />,
    },
  ];

  const table = useTable({ data: items, columns, defaultPageSize: 10, getRowId: (item) => item.penugasanId });

  return (
    <>
      <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
        Jumlah diakui = pcs <strong>diterima baik</strong> (bukan dikirim). Verifikasi hanya bisa setelah penugasan selesai.
        Tahap 3 berhenti di <strong>siap dibayar</strong> — pembayaran ada di modul keuangan.
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <TableToolbar>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TableSearch table={table} placeholder="Cari tagihan..." className="flex-1 sm:w-64" />
            <ColumnToggle table={table} className="shrink-0" />
          </div>
          <div />
        </TableToolbar>
        <DataTable table={table} showRowNumber />
        <TablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </div>

      <BiayaFormModal item={editItem} onClose={() => setEditItem(null)} />
    </>
  );
}
