"use client";

import { useState } from "react";
import { GudangJadiTable } from "./GudangJadiTable";
import { GudangJadiFormModal } from "./GudangJadiFormModal";
import type { GudangBarangJadi } from "@/db/schema";
import { useGudangBarangJadiList } from "@/hooks/useGudangBarangJadi";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: GudangBarangJadi[];
}

export function GudangJadiPageClient({ initialData }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<GudangBarangJadi | null>(null);
  const { data } = useGudangBarangJadiList();

  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Gudang Barang Jadi"
        breadcrumb={[{ label: "Master" }, { label: "Gudang Barang Jadi" }]}
      />

      <GudangJadiTable
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

      <GudangJadiFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
      />
    </div>
  );
}
