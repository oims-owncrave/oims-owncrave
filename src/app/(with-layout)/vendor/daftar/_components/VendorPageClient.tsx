"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { VendorTable } from "./VendorTable";
import { VendorFormModal } from "./VendorFormModal";
import { useVendorList } from "@/hooks/useVendor";
import type { Vendor } from "@/db/schema";

interface Props {
  initialData: Vendor[];
}

export function VendorPageClient({ initialData }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Vendor | null>(null);
  const { data } = useVendorList();

  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Vendor"
        breadcrumb={[{ label: "Vendor" }, { label: "Daftar Vendor" }]}
      />

      <VendorTable
        data={items}
        onAdd={() => { setEditItem(null); setModalOpen(true); }}
        onEdit={(item) => { setEditItem(item); setModalOpen(true); }}
      />

      <VendorFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
      />
    </div>
  );
}
