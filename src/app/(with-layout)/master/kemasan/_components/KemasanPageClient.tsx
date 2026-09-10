"use client";

import { useState } from "react";
import { KemasanTable } from "./KemasanTable";
import { KemasanFormModal } from "./KemasanFormModal";
import type { KemasanRow } from "@/services/kemasan";
import { useKemasanList } from "@/hooks/useKemasan";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: KemasanRow[];
}

export function KemasanPageClient({ initialData }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<KemasanRow | null>(null);
  const { data } = useKemasanList();

  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Kemasan"
        breadcrumb={[{ label: "Master" }, { label: "Kemasan" }]}
      />

      <KemasanTable
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

      <KemasanFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
      />
    </div>
  );
}
