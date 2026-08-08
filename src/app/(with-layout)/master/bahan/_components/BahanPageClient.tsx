"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BahanTable } from "./BahanTable";
import { BahanFormModal } from "./BahanFormModal";
import { ImportExcelModal } from "@/components/ui/import/ImportExcelModal";
import { useBahanList } from "@/hooks/useBahan";
import { importBahanBatch } from "@/services/import";
import type { Kategori, Satuan, Warna } from "@/db/schema";
import { PageHeader } from "@/components/ui/PageHeader";

type BahanItem = {
  id: string;
  kode: string;
  nama: string;
  kategoriId: string;
  kategoriNama: string | null;
  satuanId: string;
  satuanNama: string | null;
  satuanSingkatan: string | null;
  stokMinimum: string;
  hargaRataRata: string;
  warnaId: string | null;
  warnaNama: string | null;
  isActive: boolean;
};

interface Props {
  initialData: BahanItem[];
  kategoriOptions: Kategori[];
  satuanOptions: Satuan[];
  warnaOptions: Warna[];
}

export function BahanPageClient({
  initialData,
  kategoriOptions,
  satuanOptions,
  warnaOptions,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editItem, setEditItem] = useState<BahanItem | null>(null);
  const { data } = useBahanList();
  const qc = useQueryClient();

  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Bahan"
        breadcrumb={[{ label: "Master" }, { label: "Bahan" }]}
      />

      <BahanTable
        data={items}
        onAdd={() => {
          setEditItem(null);
          setModalOpen(true);
        }}
        onEdit={(item) => {
          setEditItem(item);
          setModalOpen(true);
        }}
        onImport={() => setImportOpen(true)}
      />

      <BahanFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
        kategoriOptions={kategoriOptions}
        satuanOptions={satuanOptions}
        warnaOptions={warnaOptions}
      />

      <ImportExcelModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
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
            setImportOpen(false);
          },
        }}
      />
    </div>
  );
}
