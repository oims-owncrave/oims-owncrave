"use client";

import { PenyesuaianTable } from "./PenyesuaianTable";
import { usePenyesuaianList } from "@/hooks/usePenyesuaian";
import type { PenyesuaianRow } from "@/services/penyesuaian";

interface Props {
  initialData: PenyesuaianRow[];
  isOwner: boolean;
}

export function PenyesuaianPageClient({ initialData, isOwner }: Props) {
  const { data } = usePenyesuaianList();
  const items = data ?? initialData;

  return (
    <div className="space-y-6">

      {isOwner && items.some((i) => i.status === "pending") && (
        <div className="flex items-center gap-3 rounded-[10px] border border-amber-200 bg-amber-50 px-5 py-3 dark:border-amber-800/50 dark:bg-amber-900/20">
          <span className="text-amber-600 dark:text-amber-400">⚠</span>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Ada{" "}
            <span className="font-semibold">
              {items.filter((i) => i.status === "pending").length} penyesuaian
            </span>{" "}
            yang menunggu persetujuan Anda.
          </p>
        </div>
      )}

      <PenyesuaianTable
        data={items}
        isOwner={isOwner}
        onAdd={() => {}}
      />
    </div>
  );
}
