"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImportExcelModal } from "@/components/ui/import/ImportExcelModal";

// Table components
import { SupplierTable } from "@/app/(with-layout)/master/supplier/_components/SupplierTable";
import { VendorTable } from "@/app/(with-layout)/vendor/daftar/_components/VendorTable";
import { PenjahitTable, type PenjahitRow } from "@/app/(with-layout)/vendor/penjahit/_components/PenjahitTable";
import { LokasiTable, type LokasiRow } from "@/app/(with-layout)/vendor/lokasi/_components/LokasiTable";
import { TarifTable, type TarifRow } from "@/app/(with-layout)/vendor/tarif/_components/TarifTable";

// Form Modal components
import { SupplierFormModal } from "@/app/(with-layout)/master/supplier/_components/SupplierFormModal";
import { VendorFormModal } from "@/app/(with-layout)/vendor/daftar/_components/VendorFormModal";
import { PenjahitFormModal } from "@/app/(with-layout)/vendor/penjahit/_components/PenjahitFormModal";
import { LokasiFormModal } from "@/app/(with-layout)/vendor/lokasi/_components/LokasiFormModal";
import { TarifFormModal } from "@/app/(with-layout)/vendor/tarif/_components/TarifFormModal";
import { VersiBaruModal } from "@/app/(with-layout)/vendor/tarif/_components/VersiBaruModal";

// Query hooks
import { useSupplierList } from "@/hooks/useSupplier";
import { useVendorList } from "@/hooks/useVendor";
import { usePenjahitList } from "@/hooks/usePenjahit";
import { useLokasiProduksiList } from "@/hooks/useLokasiProduksi";
import { useTarifJasaJahitList } from "@/hooks/useTarifJasaJahit";

// Batch import actions
import { importSupplierBatch } from "@/services/import";

import type { Supplier, Vendor, Produk } from "@/db/schema";
import type { UserRole } from "@/components/layouts/sidebar/data";

type Tab = "supplier" | "vendor" | "penjahit" | "lokasi" | "tarif";

interface TabItem {
  key: Tab;
  label: string;
  count: number;
  roles?: readonly UserRole[];
}

interface Props {
  initialSupplier: Supplier[];
  initialVendor: Vendor[];
  initialPenjahit: PenjahitRow[];
  initialLokasi: LokasiRow[];
  initialTarif: TarifRow[];
  produkList: Produk[];
  initialTab?: string;
  role: UserRole;
}

export function DataMitraPageClient({
  initialSupplier,
  initialVendor,
  initialPenjahit,
  initialLokasi,
  initialTarif,
  produkList,
  initialTab,
  role,
}: Props) {
  const qc = useQueryClient();

  // Live queries with initialData fallback
  const { data: supplierData } = useSupplierList();
  const { data: vendorData } = useVendorList();
  const { data: penjahitData } = usePenjahitList();
  const { data: lokasiData } = useLokasiProduksiList();
  const { data: tarifData } = useTarifJasaJahitList();

  const supplierItems = supplierData ?? initialSupplier;
  const vendorItems = vendorData ?? initialVendor;
  const penjahitItems = penjahitData ?? initialPenjahit;
  const lokasiItems = lokasiData ?? initialLokasi;
  const tarifItems = tarifData ?? initialTarif;

  // Filter tabs by role
  const tabs = useMemo(() => {
    const all: TabItem[] = [
      { key: "supplier", label: "Supplier", count: supplierItems.length },
      { key: "vendor", label: "Vendor", count: vendorItems.length },
      { key: "penjahit", label: "Penjahit", count: penjahitItems.length },
      { key: "lokasi", label: "Lokasi Produksi", count: lokasiItems.length },
      { key: "tarif", label: "Tarif Jasa Jahit", count: tarifItems.length, roles: ["owner", "admin_produksi"] },
    ];
    return all.filter((t) => !t.roles || t.roles.includes(role));
  }, [role, supplierItems.length, vendorItems.length, penjahitItems.length, lokasiItems.length, tarifItems.length]);

  const allowedKeys = useMemo(() => tabs.map((t) => t.key), [tabs]);
  const fallbackTab = tabs[0]?.key ?? "supplier";

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
    window.history.replaceState(null, "", `/master/data-mitra?tab=${nextTab}`);
  };

  // Tab 1: Supplier state
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierImportOpen, setSupplierImportOpen] = useState(false);
  const [supplierEditItem, setSupplierEditItem] = useState<Supplier | null>(null);

  // Tab 2: Vendor state
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendorEditItem, setVendorEditItem] = useState<Vendor | null>(null);

  // Tab 3: Penjahit state
  const [penjahitModalOpen, setPenjahitModalOpen] = useState(false);
  const [penjahitEditItem, setPenjahitEditItem] = useState<PenjahitRow | null>(null);

  // Tab 4: Lokasi Produksi state
  const [lokasiModalOpen, setLokasiModalOpen] = useState(false);
  const [lokasiEditItem, setLokasiEditItem] = useState<LokasiRow | null>(null);

  // Tab 5: Tarif state
  const [tarifModalOpen, setTarifModalOpen] = useState(false);
  const [tarifEditItem, setTarifEditItem] = useState<TarifRow | null>(null);
  const [versiItem, setVersiItem] = useState<TarifRow | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Mitra"
        breadcrumb={[{ label: "Master" }, { label: "Data Mitra" }]}
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

      {tab === "supplier" && (
        <SupplierTable
          data={supplierItems}
          onAdd={() => {
            setSupplierEditItem(null);
            setSupplierModalOpen(true);
          }}
          onEdit={(item) => {
            setSupplierEditItem(item);
            setSupplierModalOpen(true);
          }}
          onImport={() => setSupplierImportOpen(true)}
        />
      )}

      {tab === "vendor" && (
        <VendorTable
          data={vendorItems}
          onAdd={() => {
            setVendorEditItem(null);
            setVendorModalOpen(true);
          }}
          onEdit={(item) => {
            setVendorEditItem(item);
            setVendorModalOpen(true);
          }}
        />
      )}

      {tab === "penjahit" && (
        <PenjahitTable
          data={penjahitItems}
          onAdd={() => {
            setPenjahitEditItem(null);
            setPenjahitModalOpen(true);
          }}
          onEdit={(item) => {
            setPenjahitEditItem(item);
            setPenjahitModalOpen(true);
          }}
        />
      )}

      {tab === "lokasi" && (
        <LokasiTable
          data={lokasiItems}
          onAdd={() => {
            setLokasiEditItem(null);
            setLokasiModalOpen(true);
          }}
          onEdit={(item) => {
            setLokasiEditItem(item);
            setLokasiModalOpen(true);
          }}
        />
      )}

      {tab === "tarif" && (
        <div className="space-y-4">
          <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
            Tarif berversi — mengubah harga membuat <strong>versi baru</strong>, tarif lama tidak
            ditimpa. Transaksi menyimpan salinan nominal saat penugasan dibuat.
          </div>
          <TarifTable
            data={tarifItems}
            onAdd={() => {
              setTarifEditItem(null);
              setTarifModalOpen(true);
            }}
            onEdit={(item) => {
              setTarifEditItem(item);
              setTarifModalOpen(true);
            }}
            onVersiBaru={(item) => setVersiItem(item)}
          />
        </div>
      )}

      {/* Tab 1: Supplier Modals */}
      <SupplierFormModal
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        initialData={supplierEditItem}
      />
      <ImportExcelModal
        open={supplierImportOpen}
        onClose={() => setSupplierImportOpen(false)}
        config={{
          title: "Import Supplier",
          templateFilename: "template-supplier",
          columns: [
            { key: "kode", header: "Kode", example: "SUP-001", required: true },
            { key: "nama", header: "Nama", example: "PT Tekstil Jaya", required: true },
            { key: "kontak", header: "Kontak", example: "08123456789", required: false },
            { key: "alamat", header: "Alamat", example: "Jl. Industri No. 12, Bandung", required: false },
          ],
          action: importSupplierBatch,
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["supplier"] });
            setSupplierImportOpen(false);
          },
        }}
      />

      {/* Tab 2: Vendor Modals */}
      <VendorFormModal
        open={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        initialData={vendorEditItem}
      />

      {/* Tab 3: Penjahit Modals */}
      <PenjahitFormModal
        open={penjahitModalOpen}
        onClose={() => setPenjahitModalOpen(false)}
        initialData={penjahitEditItem}
        vendorList={vendorItems}
        lokasiList={lokasiItems}
        produkList={produkList}
      />

      {/* Tab 4: Lokasi Produksi Modals */}
      <LokasiFormModal
        open={lokasiModalOpen}
        onClose={() => setLokasiModalOpen(false)}
        initialData={lokasiEditItem}
        vendorList={vendorItems}
      />

      {/* Tab 5: Tarif Modals */}
      <TarifFormModal
        open={tarifModalOpen}
        onClose={() => setTarifModalOpen(false)}
        initialData={tarifEditItem}
        vendorList={vendorItems}
        penjahitList={penjahitItems}
        produkList={produkList}
      />
      <VersiBaruModal
        item={versiItem}
        onClose={() => setVersiItem(null)}
      />
    </div>
  );
}
