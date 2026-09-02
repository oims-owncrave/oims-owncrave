"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LokasiTable } from "./LokasiTable";
import { LokasiFormModal } from "./LokasiFormModal";
import { useLokasiProduksiList } from "@/hooks/useLokasiProduksi";
import type { Vendor } from "@/db/schema";
import type { LokasiRow } from "./LokasiTable";

interface Props {
  initialData: LokasiRow[];
  vendorList: Vendor[];
}

export function LokasiPageClient({ initialData, vendorList }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<LokasiRow | null>(null);
  const { data } = useLokasiProduksiList();

  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lokasi Produksi"
        breadcrumb={[{ label: "Vendor" }, { label: "Lokasi Produksi" }]}
      />

      <LokasiTable
        data={items}
        onAdd={() => { setEditItem(null); setModalOpen(true); }}
        onEdit={(item) => { setEditItem(item); setModalOpen(true); }}
      />

      <LokasiFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
        vendorList={vendorList}
      />
    </div>
  );
}
