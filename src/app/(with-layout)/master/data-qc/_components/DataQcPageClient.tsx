"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

// Table components
import { StandarQcTable } from "@/app/(with-layout)/qc/standar/_components/StandarQcTable";
import { JenisCacatTable } from "@/app/(with-layout)/master/jenis-cacat/_components/JenisCacatTable";
import { BagianProdukTable } from "@/app/(with-layout)/master/bagian-produk/_components/BagianProdukTable";

// Form Modal components
import { JenisCacatFormModal } from "@/app/(with-layout)/master/jenis-cacat/_components/JenisCacatFormModal";
import { BagianProdukFormModal } from "@/app/(with-layout)/master/bagian-produk/_components/BagianProdukFormModal";

// Query hooks
import { useStandarQcList } from "@/hooks/useStandarQc";
import { useJenisCacatList } from "@/hooks/useJenisCacat";
import { useBagianProdukList } from "@/hooks/useBagianProduk";

import type { StandarQcRow } from "@/services/standar-qc";
import type { JenisCacat } from "@/db/schema";
import type { BagianProdukRow } from "@/services/bagian-produk";
import type { UserRole } from "@/components/layouts/sidebar/data";

type Tab = "standar" | "jenis-cacat" | "bagian-produk";

interface TabItem {
  key: Tab;
  label: string;
  count: number;
  roles?: readonly UserRole[];
}

interface Props {
  initialStandar: StandarQcRow[];
  initialJenisCacat: JenisCacat[];
  initialBagianProduk: BagianProdukRow[];
  initialTab?: string;
  role: UserRole;
}

export function DataQcPageClient({
  initialStandar,
  initialJenisCacat,
  initialBagianProduk,
  initialTab,
  role,
}: Props) {
  // Live queries with initialData fallback
  const { data: standarData } = useStandarQcList();
  const { data: jenisCacatData } = useJenisCacatList();
  const { data: bagianProdukData } = useBagianProdukList();

  const standarItems = standarData ?? initialStandar;
  const jenisCacatItems = jenisCacatData ?? initialJenisCacat;
  const bagianProdukItems = bagianProdukData ?? initialBagianProduk;

  // Filter tabs by role
  const tabs = useMemo(() => {
    const all: TabItem[] = [
      { key: "standar", label: "Standar QC", count: standarItems.length, roles: ["owner", "admin_produksi"] },
      { key: "jenis-cacat", label: "Jenis Cacat", count: jenisCacatItems.length },
      { key: "bagian-produk", label: "Bagian Produk", count: bagianProdukItems.length, roles: ["owner", "admin_produksi"] },
    ];
    return all.filter((t) => !t.roles || t.roles.includes(role));
  }, [role, standarItems.length, jenisCacatItems.length, bagianProdukItems.length]);

  const allowedKeys = useMemo(() => tabs.map((t) => t.key), [tabs]);
  const fallbackTab = tabs[0]?.key ?? "jenis-cacat";

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
    window.history.replaceState(null, "", `/master/data-qc?tab=${nextTab}`);
  };

  // Tab 2: Jenis Cacat state
  const [jenisCacatModalOpen, setJenisCacatModalOpen] = useState(false);
  const [jenisCacatEditItem, setJenisCacatEditItem] = useState<JenisCacat | null>(null);

  // Tab 3: Bagian Produk state
  const [bagianProdukModalOpen, setBagianProdukModalOpen] = useState(false);
  const [bagianProdukEditItem, setBagianProdukEditItem] = useState<BagianProdukRow | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data QC"
        breadcrumb={[{ label: "Master" }, { label: "Data QC" }]}
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

      {tab === "standar" && (
        <StandarQcTable data={standarItems} />
      )}

      {tab === "jenis-cacat" && (
        <JenisCacatTable
          data={jenisCacatItems}
          onAdd={() => {
            setJenisCacatEditItem(null);
            setJenisCacatModalOpen(true);
          }}
          onEdit={(item) => {
            setJenisCacatEditItem(item);
            setJenisCacatModalOpen(true);
          }}
        />
      )}

      {tab === "bagian-produk" && (
        <BagianProdukTable
          data={bagianProdukItems}
          onAdd={() => {
            setBagianProdukEditItem(null);
            setBagianProdukModalOpen(true);
          }}
          onEdit={(item) => {
            setBagianProdukEditItem(item);
            setBagianProdukModalOpen(true);
          }}
        />
      )}

      {/* Tab 2: Jenis Cacat Modal */}
      <JenisCacatFormModal
        open={jenisCacatModalOpen}
        onClose={() => setJenisCacatModalOpen(false)}
        initialData={jenisCacatEditItem}
      />

      {/* Tab 3: Bagian Produk Modal */}
      <BagianProdukFormModal
        open={bagianProdukModalOpen}
        onClose={() => setBagianProdukModalOpen(false)}
        initialData={bagianProdukEditItem}
      />
    </div>
  );
}
