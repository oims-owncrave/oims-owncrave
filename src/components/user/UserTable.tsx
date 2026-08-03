"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDeactivateUser } from "@/hooks/useUser";
import type { User } from "@/db/schema";

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

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-stroke dark:border-stroke-dark">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke bg-gray-1 dark:border-stroke-dark dark:bg-dark-2">
              {["Username", "Nama", "Role", "Status", "Aksi"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-medium text-dark-4 dark:text-dark-6"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((user) => {
              const username = user.email.split("@")[0] ?? user.email;
              const isSelf = user.id === currentUserId;
              return (
                <tr
                  key={user.id}
                  className="border-b border-stroke last:border-0 dark:border-stroke-dark hover:bg-gray-1 dark:hover:bg-dark-2 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-dark dark:text-white">
                    {username}
                  </td>
                  <td className="px-4 py-3 text-dark-4 dark:text-dark-6">
                    {user.displayName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        ROLE_COLORS[user.role],
                      )}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        user.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                      )}
                    >
                      {user.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(user)}
                      >
                        Edit
                      </Button>
                      {!isSelf && user.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-900/20"
                          onClick={() => setDeactivateId(user.id)}
                        >
                          Nonaktifkan
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-dark-5 dark:text-dark-6"
                >
                  Belum ada user
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
