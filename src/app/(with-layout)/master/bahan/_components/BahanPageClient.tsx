"use client";

import { useState } from "react";
import { BahanTable } from "./BahanTable";
import { BahanFormModal } from "./BahanFormModal";
import { useBahanList } from "@/hooks/useBahan";
import type { Kategori, Satuan } from "@/db/schema";
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
  isActive: boolean;
};

interface Props {
  initialData: BahanItem[];
  kategoriOptions: Kategori[];
  satuanOptions: Satuan[];
}

export function BahanPageClient({
  initialData,
  kategoriOptions,
  satuanOptions,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<BahanItem | null>(null);
  const { data } = useBahanList();

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
      />

      <BahanFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
        kategoriOptions={kategoriOptions}
        satuanOptions={satuanOptions}
      />
    </div>
  );
}
