"use client";

import { useState } from "react";
import { WarnaTable } from "./WarnaTable";
import { WarnaFormModal } from "./WarnaFormModal";
import type { Warna } from "@/db/schema";
import { useWarnaList } from "@/hooks/useWarna";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: Warna[];
}

export function WarnaPageClient({ initialData }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Warna | null>(null);
  const { data } = useWarnaList();

  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Warna"
        breadcrumb={[{ label: "Master" }, { label: "Warna" }]}
      />

      <WarnaTable
        data={items}
        onAdd={() => { setEditItem(null); setModalOpen(true); }}
        onEdit={(item) => { setEditItem(item); setModalOpen(true); }}
      />

      <WarnaFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
      />
    </div>
  );
}
