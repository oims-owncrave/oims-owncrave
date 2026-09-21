"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { FinishingPageClient } from "./FinishingPageClient";
import { PackingPageClient } from "../../packing/_components/PackingPageClient";
import { useBarisSiapFinishing } from "@/hooks/useFinishing";
import { useBarisSiapPacking } from "@/hooks/usePacking";
import type { BarisFinishingRow, FinishingRow } from "@/services/finishing";
import type { BarisPackingRow, PackingRow } from "@/services/packing";
import type { KemasanRow } from "@/services/kemasan";
import type { GudangBarangJadi } from "@/db/schema";
import type { UserRole } from "@/components/layouts/sidebar/data";

type UserOpt = { id: string; displayName: string; isActive: boolean };
type BahanOpt = { id: string; kode: string; nama: string; isActive: boolean };

type Tab = "finishing" | "packing";

interface TabItem {
  key: Tab;
  label: string;
  count: number;
  roles?: readonly UserRole[];
}

interface Props {
  barisFinishing: BarisFinishingRow[];
  listFinishingData: FinishingRow[];
  userOptions: UserOpt[];
  bahanOptions: BahanOpt[];
  barisPacking: BarisPackingRow[];
  listPackingData: PackingRow[];
  kemasanOptions: KemasanRow[];
  gudangOptions: GudangBarangJadi[];
  initialTab?: string;
  role: UserRole;
}

export function FinishingCombinedPageClient({
  barisFinishing,
  listFinishingData,
  userOptions,
  bahanOptions,
  barisPacking,
  listPackingData,
  kemasanOptions,
  gudangOptions,
  initialTab,
  role,
}: Props) {
  const { data: barisFinishingLive } = useBarisSiapFinishing();
  const { data: barisPackingLive } = useBarisSiapPacking();

  const antreanFinishing = barisFinishingLive ?? barisFinishing;
  const antreanPacking = barisPackingLive ?? barisPacking;

  const tabs = useMemo(() => {
    const all: TabItem[] = [
      {
        key: "finishing",
        label: "Finishing",
        count: antreanFinishing.length,
        roles: ["owner", "admin_produksi"],
      },
      {
        key: "packing",
        label: "Packing",
        count: antreanPacking.length,
        roles: ["owner", "admin_produksi", "admin_gudang"],
      },
    ];
    return all.filter((t) => !t.roles || t.roles.includes(role));
  }, [role, antreanFinishing.length, antreanPacking.length]);

  const allowedKeys = useMemo(() => tabs.map((t) => t.key), [tabs]);
  const fallbackTab = tabs[0]?.key ?? "packing";

  const getValidTab = (val: string | undefined | null): Tab => {
    if (val && (allowedKeys as string[]).includes(val)) {
      return val as Tab;
    }
    return fallbackTab;
  };

  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (p && (allowedKeys as string[]).includes(p)) return p as Tab;
    }
    return getValidTab(initialTab);
  });

  useEffect(() => {
    const onPopState = () => {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (p && (allowedKeys as string[]).includes(p)) {
        setTab(p as Tab);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [allowedKeys]);

  useEffect(() => {
    if (!allowedKeys.includes(tab)) {
      setTab(fallbackTab);
    }
  }, [allowedKeys, tab, fallbackTab]);

  const handleTabChange = (nextTab: Tab) => {
    setTab(nextTab);
    window.history.replaceState(null, "", `/qc/finishing?tab=${nextTab}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finishing"
        breadcrumb={[{ label: "Quality Control" }, { label: "Finishing" }]}
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

      {tab === "finishing" && allowedKeys.includes("finishing") && (
        <FinishingPageClient
          baris={barisFinishing}
          listData={listFinishingData}
          userOptions={userOptions}
          bahanOptions={bahanOptions}
          hideHeader
        />
      )}

      {tab === "packing" && allowedKeys.includes("packing") && (
        <PackingPageClient
          baris={barisPacking}
          listData={listPackingData}
          kemasanOptions={kemasanOptions}
          gudangOptions={gudangOptions}
          userOptions={userOptions}
          hideHeader
        />
      )}
    </div>
  );
}
