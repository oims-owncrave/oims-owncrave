"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { DateInput } from "@/components/ui/DateInput";
import {
  DataTable,
  useTable,
  ColumnDef,
  TableToolbar,
  TableSearch,
  ColumnToggle,
  TableActions,
  TableAction,
} from "@/components/ui/table";
import { AuditLogDiffModal } from "./AuditLogDiffModal";
import type { AuditLogRow } from "@/services/audit";

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));

const AKSI_CONFIG: Record<string, { label: string; cls: string }> = {
  CREATE: {
    label: "CREATE",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  UPDATE: {
    label: "UPDATE",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  DELETE: {
    label: "DELETE",
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  APPROVE: {
    label: "APPROVE",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  REJECT: {
    label: "REJECT",
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  },
};

interface Props {
  data: AuditLogRow[];
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  filterTabel: string;
  filterAksi: string;
  filterUserId: string;
  filterFrom: string;
  filterTo: string;
  onFilterTabelChange: (v: string) => void;
  onFilterAksiChange: (v: string) => void;
  onFilterUserChange: (v: string) => void;
  onFilterFromChange: (v: string) => void;
  onFilterToChange: (v: string) => void;
  tableOptions: string[];
  userOptions: { id: string; displayName: string }[];
}

export function AuditLogTable({
  data,
  page,
  total,
  pageSize,
  onPageChange,
  filterTabel,
  filterAksi,
  filterUserId,
  filterFrom,
  filterTo,
  onFilterTabelChange,
  onFilterAksiChange,
  onFilterUserChange,
  onFilterFromChange,
  onFilterToChange,
  tableOptions,
  userOptions,
}: Props) {
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  const actions: TableAction<AuditLogRow>[] = [
    {
      icon: <Eye size={16} />,
      title: "Lihat Diff Data",
      onClick: (item) => setSelectedLog(item),
      variant: "default",
    },
  ];

  const columns: ColumnDef<AuditLogRow>[] = [
    {
      key: "createdAt",
      label: "Waktu",
      renderCell: (item) => fmtDate(item.createdAt),
    },
    {
      key: "userNama",
      label: "Pelaku",
      renderCell: (item) => (
        <div>
          <p className="font-medium text-dark dark:text-white">{item.userNama}</p>
          {item.userEmail && (
            <p className="text-xs text-dark-5 dark:text-dark-6">{item.userEmail}</p>
          )}
        </div>
      ),
    },
    {
      key: "aksi",
      label: "Aksi",
      align: "center",
      renderCell: (item) => {
        const cfg = AKSI_CONFIG[item.aksi] ?? {
          label: item.aksi,
          cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        };
        return (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", cfg.cls)}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "tabel",
      label: "Tabel Target",
      renderCell: (item) => (
        <span className="font-mono text-xs font-medium text-dark dark:text-white">
          {item.tabel}
        </span>
      ),
    },
    {
      key: "recordId",
      label: "Record ID",
      renderCell: (item) => (
        <span className="font-mono text-xs text-dark-5 dark:text-dark-6">
          {item.recordId}
        </span>
      ),
    },
    {
      key: "id",
      label: "Detail",
      sortable: false,
      searchable: false,
      align: "center",
      renderCell: (item) => <TableActions item={item} actions={actions} />,
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
    <>
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter User */}
            <ComboSelect
              variant="filter"
              placeholder="Semua Pelaku"
              options={[
                { label: "Semua Pelaku", value: "" },
                ...userOptions.map((u) => ({ label: u.displayName, value: u.id })),
              ]}
              value={filterUserId || null}
              onChange={(v) => onFilterUserChange((v as string) ?? "")}
            />

            {/* Filter Tabel */}
            <ComboSelect
              variant="filter"
              placeholder="Semua Tabel"
              options={[
                { label: "Semua Tabel", value: "" },
                ...tableOptions.map((t) => ({ label: t, value: t })),
              ]}
              value={filterTabel || null}
              onChange={(v) => onFilterTabelChange((v as string) ?? "")}
            />

            {/* Filter Aksi */}
            <ComboSelect
              variant="filter"
              placeholder="Semua Aksi"
              options={[
                { label: "Semua Aksi", value: "" },
                { label: "CREATE", value: "CREATE" },
                { label: "UPDATE", value: "UPDATE" },
                { label: "DELETE", value: "DELETE" },
                { label: "APPROVE", value: "APPROVE" },
                { label: "REJECT", value: "REJECT" },
              ]}
              value={filterAksi || null}
              onChange={(v) => onFilterAksiChange((v as string) ?? "")}
            />

            {/* Date Filters without labels */}
            <DateInput
              value={filterFrom}
              onChange={onFilterFromChange}
              placeholder="Dari Tanggal"
            />
            <DateInput
              value={filterTo}
              onChange={onFilterToChange}
              placeholder="Sampai Tanggal"
            />
          </div>
        </div>

        {/* Table container matching master pattern */}
        <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
          <TableToolbar>
            <TableSearch table={table} placeholder="Cari tabel / ID / pelaku..." />
            <div className="flex items-center gap-2">
              <ColumnToggle table={table} />
            </div>
          </TableToolbar>
          <DataTable table={table} showRowNumber />
        </div>

        {/* Server pagination controls for multi-page audit logs */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-1 text-sm text-dark-5 dark:text-dark-6">
            <span>
              Halaman {page} dari {totalPages} ({total} entri log)
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

      <AuditLogDiffModal
        open={selectedLog !== null}
        item={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </>
  );
}
