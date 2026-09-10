"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PenjahitTable, type PenjahitRow } from "./PenjahitTable";
import { PenjahitFormModal } from "./PenjahitFormModal";
import { usePenjahitList } from "@/hooks/usePenjahit";
import type { Vendor, Produk } from "@/db/schema";
import type { LokasiRow } from "../../lokasi/_components/LokasiTable";

interface Props {
  initialData: PenjahitRow[];
  vendorList: Vendor[];
  lokasiList: LokasiRow[];
  produkList: Produk[];
}

export function PenjahitPageClient({ initialData, vendorList, lokasiList, produkList }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PenjahitRow | null>(null);
  const { data } = usePenjahitList();

  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Penjahit"
        breadcrumb={[{ label: "Vendor" }, { label: "Penjahit" }]}
      />

      <PenjahitTable
        data={items}
        onAdd={() => { setEditItem(null); setModalOpen(true); }}
        onEdit={(item) => { setEditItem(item); setModalOpen(true); }}
      />

      <PenjahitFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
        vendorList={vendorList}
        lokasiList={lokasiList}
        produkList={produkList}
      />
    </div>
  );
}
