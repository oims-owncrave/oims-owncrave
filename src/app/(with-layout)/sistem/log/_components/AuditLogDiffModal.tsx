"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AuditLogRow } from "@/services/audit";

interface Props {
  open: boolean;
  item: AuditLogRow | null;
  onClose: () => void;
}

function parseJSON(str: string | null) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

export function AuditLogDiffModal({ open, item, onClose }: Props) {
  if (!open || !item) return null;

  const beforeObj = parseJSON(item.dataBefore);
  const afterObj = parseJSON(item.dataAfter);

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke pb-4 dark:border-dark-3">
          <div>
            <h3 className="text-lg font-bold text-dark dark:text-white">
              Detail Audit Log — {item.aksi} ({item.tabel})
            </h3>
            <p className="text-xs text-dark-5 dark:text-dark-6">
              Record ID: <span className="font-mono">{item.recordId}</span> | Oleh: {item.userNama}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-dark-5 hover:bg-gray-100 dark:text-dark-6 dark:hover:bg-dark-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content: Before vs After */}
        <div className="my-4 grid grid-cols-1 gap-4 md:grid-cols-2 overflow-y-auto pr-1">
          {/* Data Before */}
          <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-2">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Data Sebelum (Before)
            </h4>
            {beforeObj ? (
              <pre className="overflow-x-auto text-xs font-mono text-dark dark:text-white whitespace-pre-wrap">
                {JSON.stringify(beforeObj, null, 2)}
              </pre>
            ) : (
              <p className="text-xs italic text-dark-5 dark:text-dark-6">
                Tidak ada data sebelum (Entri Baru / CREATE)
              </p>
            )}
          </div>

          {/* Data After */}
          <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-2">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
              Data Sesudah (After)
            </h4>
            {afterObj ? (
              <pre className="overflow-x-auto text-xs font-mono text-dark dark:text-white whitespace-pre-wrap">
                {JSON.stringify(afterObj, null, 2)}
              </pre>
            ) : (
              <p className="text-xs italic text-dark-5 dark:text-dark-6">
                Tidak ada data sesudah (Penghapusan / DELETE)
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-stroke pt-4 dark:border-dark-3">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
