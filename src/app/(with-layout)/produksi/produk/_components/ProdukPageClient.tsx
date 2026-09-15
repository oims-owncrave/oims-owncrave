"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ProdukTable } from "./ProdukTable";
import { ProdukFormModal } from "./ProdukFormModal";
import type { Produk } from "@/db/schema";
import { useProdukList } from "@/hooks/useProduk";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImportExcelModal } from "@/components/ui/import/ImportExcelModal";
import { importProdukBatch } from "@/services/import";

interface Props {
  initialData: Produk[];
}

export function ProdukPageClient({ initialData }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Produk | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const qc = useQueryClient();
  const { data } = useProdukList();

  const items = data ?? initialData;

  // Saran Kategori/Brand/Jenis diambil dari nilai yang sudah dipakai — dropdown yang
  // tetap menerima ketikan baru, supaya klien bisa menambah tanpa ubah kode.
  const saran = (k: "kategori" | "brand" | "jenis") =>
    [...new Set(items.map((p) => p[k]).filter((v): v is string => !!v?.trim()))].sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Produk"
        breadcrumb={[{ label: "Produksi" }, { label: "Produk" }]}
      />

      <ProdukTable
        data={items}
        onAdd={() => { setEditItem(null); setModalOpen(true); }}
        onEdit={(item) => { setEditItem(item); setModalOpen(true); }}
        onImport={() => setImportOpen(true)}
      />

      <ProdukFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
        saranKategori={saran("kategori")}
        saranBrand={saran("brand")}
        saranJenis={saran("jenis")}
      />

      <ImportExcelModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
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
            setImportOpen(false);
          },
        }}
      />
    </div>
  );
}
