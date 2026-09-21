"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ImportExcelModal } from "@/components/ui/import/ImportExcelModal";

// Table components
import { KategoriTable } from "@/app/(with-layout)/master/kategori/_components/KategoriTable";
import { SatuanTable } from "@/app/(with-layout)/master/satuan/_components/SatuanTable";
import { WarnaTable } from "@/app/(with-layout)/master/warna/_components/WarnaTable";
import { BahanTable } from "@/app/(with-layout)/master/bahan/_components/BahanTable";

// Form Modal components
import { KategoriFormModal } from "@/app/(with-layout)/master/kategori/_components/KategoriFormModal";
import { SatuanFormModal } from "@/app/(with-layout)/master/satuan/_components/SatuanFormModal";
import { WarnaFormModal } from "@/app/(with-layout)/master/warna/_components/WarnaFormModal";
import { BahanFormModal } from "@/app/(with-layout)/master/bahan/_components/BahanFormModal";

// Query & Mutation hooks
import { useKategoriList } from "@/hooks/useKategori";
import { useSatuanList, useSatuanMutation } from "@/hooks/useSatuan";
import { useWarnaList } from "@/hooks/useWarna";
import { useBahanList } from "@/hooks/useBahan";

// Import batch actions
import {
  importKategoriBatch,
  importSatuanBatch,
  importWarnaBatch,
  importBahanBatch,
} from "@/services/import";

import type { Kategori, Satuan, Warna } from "@/db/schema";
import type { listBahan } from "@/services/bahan";

type BahanItem = Awaited<ReturnType<typeof listBahan>>[number];

type Tab = "bahan" | "kategori" | "satuan" | "warna";

const TAB_KEYS: Tab[] = ["bahan", "kategori", "satuan", "warna"];

function isTab(x: string | undefined | null): x is Tab {
  return typeof x === "string" && (TAB_KEYS as string[]).includes(x);
}

interface Props {
  initialKategori: Kategori[];
  initialSatuan: Satuan[];
  initialWarna: Warna[];
  initialBahan: BahanItem[];
  initialTab?: string;
}

export function DataBahanPageClient({
  initialKategori,
  initialSatuan,
  initialWarna,
  initialBahan,
  initialTab,
}: Props) {
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (isTab(p)) return p;
    }
    return isTab(initialTab) ? initialTab : "bahan";
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
    window.history.replaceState(null, "", `/master/data-bahan?tab=${nextTab}`);
  };

  // Queries for live updates with initialData fallbacks
  const { data: kategoriData } = useKategoriList();
  const { data: satuanData } = useSatuanList();
  const { data: warnaData } = useWarnaList();
  const { data: bahanData } = useBahanList();

  const kategoriItems = kategoriData ?? initialKategori;
  const satuanItems = satuanData ?? initialSatuan;
  const warnaItems = warnaData ?? initialWarna;
  const bahanItems = bahanData ?? initialBahan;

  // Mutations
  const { remove: removeSatuan } = useSatuanMutation();

  // Tab 1: Kategori state
  const [kategoriModalOpen, setKategoriModalOpen] = useState(false);
  const [kategoriImportOpen, setKategoriImportOpen] = useState(false);
  const [kategoriEditItem, setKategoriEditItem] = useState<Kategori | null>(null);

  // Tab 2: Satuan state
  const [satuanModalOpen, setSatuanModalOpen] = useState(false);
  const [satuanImportOpen, setSatuanImportOpen] = useState(false);
  const [satuanEditItem, setSatuanEditItem] = useState<Satuan | null>(null);
  const [satuanDeleteId, setSatuanDeleteId] = useState<string | null>(null);

  // Tab 3: Warna state
  const [warnaModalOpen, setWarnaModalOpen] = useState(false);
  const [warnaImportOpen, setWarnaImportOpen] = useState(false);
  const [warnaEditItem, setWarnaEditItem] = useState<Warna | null>(null);

  // Tab 4: Bahan state
  const [bahanModalOpen, setBahanModalOpen] = useState(false);
  const [bahanImportOpen, setBahanImportOpen] = useState(false);
  const [bahanEditItem, setBahanEditItem] = useState<BahanItem | null>(null);


  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "bahan", label: "Bahan", count: bahanItems.length },
    { key: "kategori", label: "Kategori", count: kategoriItems.length },
    { key: "satuan", label: "Satuan", count: satuanItems.length },
    { key: "warna", label: "Warna", count: warnaItems.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Bahan"
        breadcrumb={[{ label: "Master" }, { label: "Data Bahan" }]}
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

      {tab === "kategori" && (
        <KategoriTable
          data={kategoriItems}
          onAdd={() => {
            setKategoriEditItem(null);
            setKategoriModalOpen(true);
          }}
          onEdit={(item) => {
            setKategoriEditItem(item);
            setKategoriModalOpen(true);
          }}
          onImport={() => setKategoriImportOpen(true)}
        />
      )}

      {tab === "satuan" && (
        <SatuanTable
          data={satuanItems}
          onAdd={() => {
            setSatuanEditItem(null);
            setSatuanModalOpen(true);
          }}
          onEdit={(item) => {
            setSatuanEditItem(item);
            setSatuanModalOpen(true);
          }}
          onDelete={(id) => setSatuanDeleteId(id)}
          onImport={() => setSatuanImportOpen(true)}
        />
      )}

      {tab === "warna" && (
        <WarnaTable
          data={warnaItems}
          onAdd={() => {
            setWarnaEditItem(null);
            setWarnaModalOpen(true);
          }}
          onEdit={(item) => {
            setWarnaEditItem(item);
            setWarnaModalOpen(true);
          }}
          onImport={() => setWarnaImportOpen(true)}
        />
      )}

      {tab === "bahan" && (
        <BahanTable
          data={bahanItems}
          onAdd={() => {
            setBahanEditItem(null);
            setBahanModalOpen(true);
          }}
          onEdit={(item) => {
            setBahanEditItem(item);
            setBahanModalOpen(true);
          }}
          onImport={() => setBahanImportOpen(true)}
        />
      )}

      {/* Tab 1: Kategori Modals */}
      <KategoriFormModal
        open={kategoriModalOpen}
        onClose={() => setKategoriModalOpen(false)}
        initialData={kategoriEditItem}
      />
      <ImportExcelModal
        open={kategoriImportOpen}
        onClose={() => setKategoriImportOpen(false)}
        config={{
          title: "Import Kategori",
          templateFilename: "template-kategori",
          columns: [
            { key: "kode", header: "Kode", example: "KTN", required: true },
            { key: "nama", header: "Nama", example: "Katun", required: true },
          ],
          action: importKategoriBatch,
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["kategori"] });
            setKategoriImportOpen(false);
          },
        }}
      />

      {/* Tab 2: Satuan Modals */}
      <SatuanFormModal
        open={satuanModalOpen}
        onClose={() => setSatuanModalOpen(false)}
        initialData={satuanEditItem}
      />
      <ImportExcelModal
        open={satuanImportOpen}
        onClose={() => setSatuanImportOpen(false)}
        config={{
          title: "Import Satuan",
          templateFilename: "template-satuan",
          columns: [
            { key: "nama", header: "Nama", example: "Meter", required: true },
            { key: "singkatan", header: "Singkatan", example: "m", required: true },
          ],
          action: importSatuanBatch,
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["satuan"] });
            setSatuanImportOpen(false);
          },
        }}
      />
      <ConfirmDialog
        open={satuanDeleteId !== null}
        title="Hapus Satuan?"
        message="Satuan yang sudah dipakai oleh bahan tidak dapat dihapus, hanya bisa dinonaktifkan."
        confirmLabel="Hapus"
        onConfirm={() => {
          if (satuanDeleteId) removeSatuan.mutate(satuanDeleteId);
          setSatuanDeleteId(null);
        }}
        onCancel={() => setSatuanDeleteId(null)}
        loading={removeSatuan.isPending}
      />

      {/* Tab 3: Warna Modals */}
      <WarnaFormModal
        open={warnaModalOpen}
        onClose={() => setWarnaModalOpen(false)}
        initialData={warnaEditItem}
      />
      <ImportExcelModal
        open={warnaImportOpen}
        onClose={() => setWarnaImportOpen(false)}
        config={{
          title: "Import Warna",
          templateFilename: "template-warna",
          columns: [
            { key: "kode", header: "Kode", example: "HTM", required: true },
            { key: "nama", header: "Nama", example: "Hitam", required: true },
          ],
          action: importWarnaBatch,
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["warna"] });
            setWarnaImportOpen(false);
          },
        }}
      />

      {/* Tab 4: Bahan Modals */}
      <BahanFormModal
        open={bahanModalOpen}
        onClose={() => setBahanModalOpen(false)}
        initialData={bahanEditItem}
        kategoriOptions={kategoriItems}
        satuanOptions={satuanItems}
        warnaOptions={warnaItems}
      />
      <ImportExcelModal
        open={bahanImportOpen}
        onClose={() => setBahanImportOpen(false)}
        config={{
          title: "Import Bahan",
          templateFilename: "template-bahan",
          columns: [
            { key: "nama", header: "Nama Bahan", example: "Katun Combed 30s", required: true },
            { key: "kategori", header: "Kategori", example: "KTN", required: true },
            { key: "satuan", header: "Satuan", example: "Meter", required: true },
            { key: "warna", header: "Warna", example: "Hitam", required: false },
            { key: "stokMinimum", header: "Stok Minimum", example: "10", required: false },
            { key: "hargaAwal", header: "Harga Awal", example: "25000", required: false },
          ],
          action: importBahanBatch,
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["bahan"] });
            setBahanImportOpen(false);
          },
        }}
      />

    </div>
  );
}
