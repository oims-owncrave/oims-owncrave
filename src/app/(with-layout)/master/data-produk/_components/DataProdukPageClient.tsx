"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImportExcelModal } from "@/components/ui/import/ImportExcelModal";

// Table components
import { ProdukTable } from "@/app/(with-layout)/produksi/produk/_components/ProdukTable";
import { BomTable } from "@/app/(with-layout)/produksi/bom/_components/BomTable";
import { KemasanTable } from "@/app/(with-layout)/master/kemasan/_components/KemasanTable";
import { GudangJadiTable } from "@/app/(with-layout)/master/gudang-jadi/_components/GudangJadiTable";

// Form Modal components
import { ProdukFormModal } from "@/app/(with-layout)/produksi/produk/_components/ProdukFormModal";
import { KemasanFormModal } from "@/app/(with-layout)/master/kemasan/_components/KemasanFormModal";
import { GudangJadiFormModal } from "@/app/(with-layout)/master/gudang-jadi/_components/GudangJadiFormModal";

// Query hooks
import { useProdukList } from "@/hooks/useProduk";
import { useBomList } from "@/hooks/useBom";
import { useKemasanList } from "@/hooks/useKemasan";
import { useGudangBarangJadiList } from "@/hooks/useGudangBarangJadi";

// Batch import actions
import { importProdukBatch, importBomBatch } from "@/services/import";

import type { Produk, GudangBarangJadi } from "@/db/schema";
import type { BomListRow } from "@/services/bom";
import type { KemasanRow } from "@/services/kemasan";
import type { UserRole } from "@/components/layouts/sidebar/data";

type Tab = "produk" | "bom" | "kemasan" | "gudang";

interface TabItem {
  key: Tab;
  label: string;
  count: number;
  roles?: readonly UserRole[];
}

interface Props {
  initialProduk: Produk[];
  initialBom: BomListRow[];
  initialKemasan: KemasanRow[];
  initialGudang: GudangBarangJadi[];
  initialTab?: string;
  role: UserRole;
}

export function DataProdukPageClient({
  initialProduk,
  initialBom,
  initialKemasan,
  initialGudang,
  initialTab,
  role,
}: Props) {
  const qc = useQueryClient();

  // Live queries with initialData fallback
  const { data: produkData } = useProdukList();
  const { data: bomData } = useBomList();
  const { data: kemasanData } = useKemasanList();
  const { data: gudangData } = useGudangBarangJadiList();

  const produkItems = produkData ?? initialProduk;
  const bomItems = bomData ?? initialBom;
  const kemasanItems = kemasanData ?? initialKemasan;
  const gudangItems = gudangData ?? initialGudang;

  // Filter tabs by role
  const tabs = useMemo(() => {
    const all: TabItem[] = [
      { key: "produk", label: "Produk", count: produkItems.length },
      { key: "bom", label: "BOM", count: bomItems.length, roles: ["owner", "admin_produksi"] },
      { key: "kemasan", label: "Kemasan", count: kemasanItems.length },
      { key: "gudang", label: "Gudang Barang Jadi", count: gudangItems.length },
    ];
    return all.filter((t) => !t.roles || t.roles.includes(role));
  }, [role, produkItems.length, bomItems.length, kemasanItems.length, gudangItems.length]);

  const allowedKeys = useMemo(() => tabs.map((t) => t.key), [tabs]);
  const fallbackTab = tabs[0]?.key ?? "produk";

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
    window.history.replaceState(null, "", `/master/data-produk?tab=${nextTab}`);
  };

  // Tab 1: Produk state
  const [produkModalOpen, setProdukModalOpen] = useState(false);
  const [produkImportOpen, setProdukImportOpen] = useState(false);
  const [produkEditItem, setProdukEditItem] = useState<Produk | null>(null);

  // Tab 2: BOM state
  const [bomImportOpen, setBomImportOpen] = useState(false);

  // Tab 3: Kemasan state
  const [kemasanModalOpen, setKemasanModalOpen] = useState(false);
  const [kemasanEditItem, setKemasanEditItem] = useState<KemasanRow | null>(null);

  // Tab 4: Gudang Barang Jadi state
  const [gudangModalOpen, setGudangModalOpen] = useState(false);
  const [gudangEditItem, setGudangEditItem] = useState<GudangBarangJadi | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Produk"
        breadcrumb={[{ label: "Master" }, { label: "Data Produk" }]}
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

      {tab === "produk" && (
        <ProdukTable
          data={produkItems}
          onAdd={() => {
            setProdukEditItem(null);
            setProdukModalOpen(true);
          }}
          onEdit={(item) => {
            setProdukEditItem(item);
            setProdukModalOpen(true);
          }}
          onImport={() => setProdukImportOpen(true)}
        />
      )}

      {tab === "bom" && (
        <BomTable
          data={bomItems}
          onImport={() => setBomImportOpen(true)}
        />
      )}

      {tab === "kemasan" && (
        <KemasanTable
          data={kemasanItems}
          onAdd={() => {
            setKemasanEditItem(null);
            setKemasanModalOpen(true);
          }}
          onEdit={(item) => {
            setKemasanEditItem(item);
            setKemasanModalOpen(true);
          }}
        />
      )}

      {tab === "gudang" && (
        <GudangJadiTable
          data={gudangItems}
          onAdd={() => {
            setGudangEditItem(null);
            setGudangModalOpen(true);
          }}
          onEdit={(item) => {
            setGudangEditItem(item);
            setGudangModalOpen(true);
          }}
        />
      )}

      {/* Tab 1: Produk Modals */}
      <ProdukFormModal
        open={produkModalOpen}
        onClose={() => setProdukModalOpen(false)}
        initialData={produkEditItem}
      />
      <ImportExcelModal
        open={produkImportOpen}
        onClose={() => setProdukImportOpen(false)}
        config={{
          title: "Import Produk",
          templateFilename: "template-produk",
          columns: [
            { key: "kode", header: "Kode", example: "NJK", required: true },
            { key: "nama", header: "Nama Produk", example: "Nordic Jacket", required: true },
            { key: "kategori", header: "Kategori", example: "Jaket", required: false },
            { key: "brand", header: "Brand", example: "Owncrave", required: false },
            { key: "jenis", header: "Jenis", example: "Outerwear", required: false },
          ],
          action: importProdukBatch,
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["produk"] });
            setProdukImportOpen(false);
          },
        }}
      />

      {/* Tab 2: BOM Modals */}
      <ImportExcelModal
        open={bomImportOpen}
        onClose={() => setBomImportOpen(false)}
        config={{
          title: "Import BOM",
          templateFilename: "template-bom",
          columns: [
            { key: "produk", header: "Produk (kode/nama)", example: "NJK", required: true },
            { key: "bahan", header: "Bahan (kode/nama)", example: "BH-KTN-001", required: true },
            { key: "kuantitas", header: "Kuantitas per Pcs", example: "1.8", required: true },
            { key: "toleransi", header: "Toleransi (%)", example: "5", required: false },
            { key: "ukuran", header: "Berlaku Ukuran", example: "M", required: false },
            { key: "keterangan", header: "Keterangan", example: "Bahan utama", required: false },
          ],
          action: importBomBatch,
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["bom"] });
            setBomImportOpen(false);
          },
        }}
      />

      {/* Tab 3: Kemasan Modals */}
      <KemasanFormModal
        open={kemasanModalOpen}
        onClose={() => setKemasanModalOpen(false)}
        initialData={kemasanEditItem}
      />

      {/* Tab 4: Gudang Barang Jadi Modals */}
      <GudangJadiFormModal
        open={gudangModalOpen}
        onClose={() => setGudangModalOpen(false)}
        initialData={gudangEditItem}
      />
    </div>
  );
}
