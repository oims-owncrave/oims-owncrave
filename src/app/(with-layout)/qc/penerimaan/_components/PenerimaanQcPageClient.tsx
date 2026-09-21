"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { PenerimaanQcTable } from "./PenerimaanQcTable";
import { AntreanQcTable } from "../../antrean/_components/AntreanQcTable";
import { KirimQcModal } from "../../antrean/_components/KirimQcModal";
import { usePenerimaanQcList, useAntreanQc } from "@/hooks/usePenerimaanQc";
import type { listPenerimaanQc, AntreanQcRow } from "@/services/penerimaan-qc";

type PenerimaanItem = Awaited<ReturnType<typeof listPenerimaanQc>>[number];

type Tab = "penerimaan" | "antrean";
const TAB_KEYS: Tab[] = ["penerimaan", "antrean"];

function isTab(x: string | undefined | null): x is Tab {
  return typeof x === "string" && (TAB_KEYS as string[]).includes(x);
}

interface Props {
  initialPenerimaan: PenerimaanItem[];
  initialAntrean: AntreanQcRow[];
  initialTab?: string;
}

export function PenerimaanQcPageClient({
  initialPenerimaan,
  initialAntrean,
  initialTab,
}: Props) {
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (isTab(p)) return p;
    }
    return isTab(initialTab) ? initialTab : "penerimaan";
  });

  useEffect(() => {
    const onPopState = () => {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (isTab(p)) setTab(p);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleTabChange = (nextTab: Tab) => {
    setTab(nextTab);
    window.history.replaceState(null, "", `/qc/penerimaan?tab=${nextTab}`);
  };

  const { data: penerimaanLive } = usePenerimaanQcList();
  const { data: antreanLive } = useAntreanQc();

  const penerimaanItems = penerimaanLive ?? initialPenerimaan;
  const antreanItems = antreanLive ?? initialAntrean;

  // Modal state untuk antrean kirim QC
  const [sumberId, setSumberId] = useState<string | null>(null);
  const barisSumber = sumberId
    ? antreanItems.filter((r) => r.penerimaanHasilId === sumberId)
    : [];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "penerimaan", label: "Penerimaan QC", count: penerimaanItems.length },
    { key: "antrean", label: "Antrean QC", count: antreanItems.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penerimaan QC"
        breadcrumb={[{ label: "Quality Control" }, { label: "Penerimaan QC" }]}
      />

      <div className="flex gap-1 border-b border-stroke dark:border-dark-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer",
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

      {tab === "penerimaan" && <PenerimaanQcTable data={penerimaanItems} />}

      {tab === "antrean" && (
        <>
          <AntreanQcTable
            data={antreanItems}
            onKirim={(id) => setSumberId(id)}
          />
          <KirimQcModal
            open={sumberId !== null}
            onClose={() => setSumberId(null)}
            penerimaanHasilId={sumberId}
            baris={barisSumber}
          />
        </>
      )}
    </div>
  );
}
