"use client";

import { useState } from "react";
import { JenisCacatTable } from "./JenisCacatTable";
import { JenisCacatFormModal } from "./JenisCacatFormModal";
import type { JenisCacat } from "@/db/schema";
import { useJenisCacatList } from "@/hooks/useJenisCacat";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: JenisCacat[];
}

export function JenisCacatPageClient({ initialData }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<JenisCacat | null>(null);
  const { data } = useJenisCacatList();

  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Jenis Cacat"
        breadcrumb={[{ label: "Master" }, { label: "Jenis Cacat" }]}
      />

      <JenisCacatTable
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

      <JenisCacatFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
      />
    </div>
  );
}
