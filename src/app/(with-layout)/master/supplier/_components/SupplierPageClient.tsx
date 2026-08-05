"use client";

import { useState } from "react";
import { SupplierTable } from "./SupplierTable";
import { SupplierFormModal } from "./SupplierFormModal";
import type { Supplier } from "@/db/schema";
import { useSupplierList } from "@/hooks/useSupplier";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: Supplier[];
}

export function SupplierPageClient({ initialData }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const { data } = useSupplierList();

  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Supplier"
        breadcrumb={[{ label: "Master" }, { label: "Supplier" }]}
      />

      <SupplierTable
        data={items}
        onAdd={() => { setEditItem(null); setModalOpen(true); }}
        onEdit={(item) => { setEditItem(item); setModalOpen(true); }}
      />

      <SupplierFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
      />
    </div>
  );
}
