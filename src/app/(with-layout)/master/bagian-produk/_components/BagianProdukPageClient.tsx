"use client";

import { useState } from "react";
import { BagianProdukTable } from "./BagianProdukTable";
import { BagianProdukFormModal } from "./BagianProdukFormModal";
import type { BagianProdukRow } from "@/services/bagian-produk";
import { useBagianProdukList } from "@/hooks/useBagianProduk";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: BagianProdukRow[];
}

export function BagianProdukPageClient({ initialData }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<BagianProdukRow | null>(null);
  const { data } = useBagianProdukList();

  const items = data ?? initialData;
  const maxUrutan = items.reduce((max, it) => Math.max(max, it.urutan ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Bagian Produk"
        breadcrumb={[{ label: "Master" }, { label: "Bagian Produk" }]}
      />

      <BagianProdukTable
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

      <BagianProdukFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
        defaultUrutan={maxUrutan + 10}
      />
    </div>
  );
}
