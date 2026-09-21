"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

import { LaporanBarangMasukClient } from "../barang-masuk/_components/LaporanBarangMasukClient";
import { LaporanBarangKeluarClient } from "../barang-keluar/_components/LaporanBarangKeluarClient";
import { LaporanStokClient } from "../stok/_components/LaporanStokClient";
import { LaporanNilaiPersediaanClient } from "../nilai-persediaan/_components/LaporanNilaiPersediaanClient";
import { LaporanMutasiClient } from "../mutasi/_components/LaporanMutasiClient";

import type {
  LaporanMasukItem,
  LaporanKeluarItem,
  LaporanStokItem,
  LaporanNilaiPersediaanKategori,
} from "@/services/laporan";
import type { MutasiRow } from "@/services/mutasi";

type Tab = "barang-masuk" | "barang-keluar" | "stok" | "nilai-persediaan" | "mutasi";

const TAB_KEYS: Tab[] = [
  "barang-masuk",
  "barang-keluar",
  "stok",
  "nilai-persediaan",
  "mutasi",
];

function isTab(x: string | undefined | null): x is Tab {
  return typeof x === "string" && (TAB_KEYS as string[]).includes(x);
}

interface Props {
  initialTab?: string;
  initialBarangMasuk?: {
    items: LaporanMasukItem[];
    totalKuantitas: number;
    totalNilai: number;
  };
  initialBarangKeluar?: {
    items: LaporanKeluarItem[];
    totalKuantitas: number;
    totalNilai: number;
  };
  initialStok?: {
    items: LaporanStokItem[];
    totalNilai: number;
  };
  initialNilaiPersediaan?: {
    items: LaporanNilaiPersediaanKategori[];
    totalOverall: number;
  };
  initialMutasi?: {
    rows: MutasiRow[];
  };
  kategoriOptions: { id: string; nama: string }[];
  bahanOptions: { id: string; kode: string; nama: string }[];
}

export function LaporanPageClient({
  initialTab,
  initialBarangMasuk,
  initialBarangKeluar,
  initialStok,
  initialNilaiPersediaan,
  initialMutasi,
  kategoriOptions,
  bahanOptions,
}: Props) {
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (isTab(p)) return p;
    }
    return isTab(initialTab) ? initialTab : "barang-masuk";
  });

  const [visitedTabs, setVisitedTabs] = useState<Record<Tab, boolean>>(() => {
    const current = isTab(initialTab) ? initialTab : "barang-masuk";
    return {
      "barang-masuk": current === "barang-masuk",
      "barang-keluar": current === "barang-keluar",
      stok: current === "stok",
      "nilai-persediaan": current === "nilai-persediaan",
      mutasi: current === "mutasi",
    };
  });

  useEffect(() => {
    const onPopState = () => {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (isTab(p)) {
        setTab(p);
        setVisitedTabs((prev) => ({ ...prev, [p]: true }));
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleTabChange = (nextTab: Tab) => {
    setTab(nextTab);
    setVisitedTabs((prev) => ({ ...prev, [nextTab]: true }));
    window.history.replaceState(null, "", `/laporan?tab=${nextTab}`);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "barang-masuk", label: "Barang Masuk" },
    { key: "barang-keluar", label: "Barang Keluar" },
    { key: "stok", label: "Stok Bahan" },
    { key: "nilai-persediaan", label: "Nilai Persediaan" },
    { key: "mutasi", label: "Mutasi Stok" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        breadcrumb={[{ label: "Analitik" }, { label: "Laporan" }]}
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
          </button>
        ))}
      </div>

      <div className={cn(tab !== "barang-masuk" && "hidden")}>
        {visitedTabs["barang-masuk"] && (
          <LaporanBarangMasukClient initialData={initialBarangMasuk} />
        )}
      </div>

      <div className={cn(tab !== "barang-keluar" && "hidden")}>
        {visitedTabs["barang-keluar"] && (
          <LaporanBarangKeluarClient initialData={initialBarangKeluar} />
        )}
      </div>

      <div className={cn(tab !== "stok" && "hidden")}>
        {visitedTabs["stok"] && (
          <LaporanStokClient
            initialData={initialStok}
            kategoriOptions={kategoriOptions}
          />
        )}
      </div>

      <div className={cn(tab !== "nilai-persediaan" && "hidden")}>
        {visitedTabs["nilai-persediaan"] && (
          <LaporanNilaiPersediaanClient initialData={initialNilaiPersediaan} />
        )}
      </div>

      <div className={cn(tab !== "mutasi" && "hidden")}>
        {visitedTabs["mutasi"] && (
          <LaporanMutasiClient
            initialData={initialMutasi}
            bahanOptions={bahanOptions}
          />
        )}
      </div>
    </div>
  );
}
