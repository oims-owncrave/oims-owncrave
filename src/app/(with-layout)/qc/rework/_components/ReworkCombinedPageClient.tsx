"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReworkPageClient } from "./ReworkPageClient";
import { ReQcPageClient } from "../../re-qc/_components/ReQcPageClient";
import { useBarisSiapRework } from "@/hooks/useRework";
import { useSumberReQc } from "@/hooks/useReQc";
import type {
  BarisReworkRow,
  PerbaikanInternalRow,
  ReturQcVendorRow,
} from "@/services/rework";
import type { SumberReQcRow, ReQcRow } from "@/services/re-qc";
import type { JenisCacat } from "@/db/schema";

type UserOpt = { id: string; displayName: string; isActive: boolean };

type Tab = "rework" | "re-qc";
const TAB_KEYS: Tab[] = ["rework", "re-qc"];

function isTab(x: string | undefined | null): x is Tab {
  return typeof x === "string" && (TAB_KEYS as string[]).includes(x);
}

interface Props {
  baris: BarisReworkRow[];
  internalData: PerbaikanInternalRow[];
  returData: ReturQcVendorRow[];
  cacatOptions: JenisCacat[];
  sumber: SumberReQcRow[];
  riwayat: ReQcRow[];
  userOptions: UserOpt[];
  initialTab?: string;
}

export function ReworkCombinedPageClient({
  baris,
  internalData,
  returData,
  cacatOptions,
  sumber,
  riwayat,
  userOptions,
  initialTab,
}: Props) {
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (isTab(p)) return p;
    }
    return isTab(initialTab) ? initialTab : "rework";
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
    window.history.replaceState(null, "", `/qc/rework?tab=${nextTab}`);
  };

  const { data: barisLive } = useBarisSiapRework();
  const { data: sumberLive } = useSumberReQc();

  const antreanRework = barisLive ?? baris;
  const totalSisaRework = antreanRework.reduce((n, b) => n + b.sisa, 0);

  const antreanReQc = sumberLive ?? sumber;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "rework", label: "Rework", count: totalSisaRework },
    { key: "re-qc", label: "Re-QC", count: antreanReQc.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rework"
        breadcrumb={[{ label: "Quality Control" }, { label: "Rework" }]}
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

      {tab === "rework" && (
        <ReworkPageClient
          baris={baris}
          internalData={internalData}
          returData={returData}
          userOptions={userOptions}
          cacatOptions={cacatOptions}
          hideHeader
        />
      )}

      {tab === "re-qc" && (
        <ReQcPageClient
          sumber={sumber}
          riwayat={riwayat}
          userOptions={userOptions}
          hideHeader
        />
      )}
    </div>
  );
}
