"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDeactivateUser } from "@/hooks/useUser";
import type { User } from "@/db/schema";
import {
  DataTable,
  useTable,
  ColumnDef,
  TableToolbar,
  TableSearch,
  TablePagination,
} from "@/components/ui/table";

const ROLE_LABELS: Record<User["role"], string> = {
  owner: "Owner",
  admin_gudang: "Admin Gudang",
  admin_produksi: "Admin Produksi",
  keuangan: "Keuangan",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<User["role"], string> = {
  owner:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  admin_gudang:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  admin_produksi:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  keuangan:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  viewer: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

interface Props {
  data: User[];
  currentUserId: string;
  onEdit: (user: User) => void;
}

export function UserTable({ data, currentUserId, onEdit }: Props) {
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const deactivate = useDeactivateUser();

  const columns: ColumnDef<User>[] = [
    {
      key: "email",
      label: "Username",
      renderCell: (u) => u.email.split("@")[0] ?? u.email,
    },
    {
      key: "displayName",
      label: "Nama",
    },
    {
      key: "role",
      label: "Role",
      renderCell: (u) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            ROLE_COLORS[u.role],
          )}
        >
          {ROLE_LABELS[u.role]}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      renderCell: (u) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            u.isActive
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
          )}
        >
          {u.isActive ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      key: "id", // Using id just as a unique key for the column
      label: "Aksi",
      sortable: false,
      searchable: false,
      renderCell: (u) => {
        const isSelf = u.id === currentUserId;
        return (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(u)}>
              Edit
            </Button>
            {!isSelf && u.isActive && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-900/20"
                onClick={() => setDeactivateId(u.id)}
              >
                Nonaktifkan
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useTable({
    data,
    columns,
    defaultPageSize: 10,
    getRowId: (u) => u.id,
  });

  return (
    <>
      <div className="space-y-4">
        <TableToolbar className="px-0 sm:px-0 py-0 sm:py-0">
          <TableSearch table={table} placeholder="Cari user..." />
        </TableToolbar>
        
        <DataTable table={table} />
        
        {table.totalPages > 1 && (
          <TablePagination table={table} className="border-none px-0" />
        )}
      </div>

      <ConfirmDialog
        open={deactivateId !== null}
        title="Nonaktifkan user?"
        message="User tidak bisa login setelah dinonaktifkan. Bisa diaktifkan kembali lewat edit."
        confirmLabel="Nonaktifkan"
        onConfirm={() => {
          if (deactivateId) deactivate.mutate(deactivateId);
          setDeactivateId(null);
        }}
        onCancel={() => setDeactivateId(null)}
        loading={deactivate.isPending}
      />
    </>
  );
}
