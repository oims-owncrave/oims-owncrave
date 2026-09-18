"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { PenerimaanTable } from "@/app/(with-layout)/produksi/penerimaan-cutting/_components/PenerimaanTable";
import { WoTable } from "@/app/(with-layout)/produksi/wo-cutting/_components/WoTable";
import type { PenerimaanListRow } from "@/services/penerimaan-cutting";
import type { WoListRow } from "@/services/wo-cutting";

interface Props {
  initialPenerimaan: PenerimaanListRow[];
  initialWo: WoListRow[];
}

type Tab = "wo" | "penerimaan";

/** Cutting = satu area kerja, dua dokumen (penerimaan bahan + work order) — pola app lama. */
export function CuttingPageClient({ initialPenerimaan, initialWo }: Props) {
  const [tab, setTab] = useState<Tab>("penerimaan");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "penerimaan", label: "Penerimaan Bahan", count: initialPenerimaan.length },
    { key: "wo", label: "Work Order", count: initialWo.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Cutting" breadcrumb={[{ label: "Produksi" }, { label: "Cutting" }]} />

      <div className="flex gap-1 border-b border-stroke dark:border-dark-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-dark-5 hover:text-dark dark:text-dark-6 dark:hover:text-white",
            )}
          >
            {t.label}
            <span className="ml-2 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-dark-3">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === "wo" ? (
        <WoTable initialData={initialWo} />
      ) : (
        <PenerimaanTable initialData={initialPenerimaan} />
      )}
    </div>
  );
}
