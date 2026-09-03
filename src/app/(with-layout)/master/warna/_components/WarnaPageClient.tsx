"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WarnaTable } from "./WarnaTable";
import { WarnaFormModal } from "./WarnaFormModal";
import type { Warna } from "@/db/schema";
import { useWarnaList } from "@/hooks/useWarna";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImportExcelModal } from "@/components/ui/import/ImportExcelModal";
import { importWarnaBatch } from "@/services/import";

interface Props {
  initialData: Warna[];
}

export function WarnaPageClient({ initialData }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Warna | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const qc = useQueryClient();
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
        onImport={() => setImportOpen(true)}
      />

      <WarnaFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
      />

      <ImportExcelModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={{
          title: "Import Warna",
          templateFilename: "template-warna",
          columns: [
            { key: "kode", header: "Kode", example: "HTM", required: true },
            { key: "nama", header: "Nama", example: "Hitam", required: true },
          ],
          action: importWarnaBatch,
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["warna"] });
            setImportOpen(false);
          },
        }}
      />
    </div>
  );
}
