"use client";

import { useState } from "react";
import { KategoriTable } from "./KategoriTable";
import { KategoriFormModal } from "./KategoriFormModal";
import type { Kategori } from "@/db/schema";
import { useKategoriList } from "@/hooks/useKategori";

interface Props {
  initialData: Kategori[];
}

export function KategoriPageClient({ initialData }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Kategori | null>(null);
  const { data } = useKategoriList();

  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-dark dark:text-white">Master Kategori</h2>

      <KategoriTable
        data={items}
        onAdd={() => { setEditItem(null); setModalOpen(true); }}
        onEdit={(item) => { setEditItem(item); setModalOpen(true); }}
      />

      <KategoriFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
      />
    </div>
  );
}
