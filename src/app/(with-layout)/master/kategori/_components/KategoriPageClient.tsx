"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KategoriTable } from "./KategoriTable";
import { KategoriFormModal } from "./KategoriFormModal";
import { ImportExcelModal } from "@/components/ui/import/ImportExcelModal";
import type { Kategori } from "@/db/schema";
import { useKategoriList } from "@/hooks/useKategori";
import { importKategoriBatch } from "@/services/import";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: Kategori[];
}

export function KategoriPageClient({ initialData }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editItem, setEditItem] = useState<Kategori | null>(null);
  const { data } = useKategoriList();
  const qc = useQueryClient();

  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Kategori"
        breadcrumb={[{ label: "Master" }, { label: "Kategori" }]}
      />

      <KategoriTable
        data={items}
        onAdd={() => { setEditItem(null); setModalOpen(true); }}
        onEdit={(item) => { setEditItem(item); setModalOpen(true); }}
        onImport={() => setImportOpen(true)}
      />

      <KategoriFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
      />

      <ImportExcelModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={{
          title: "Import Kategori",
          templateFilename: "template-kategori",
          columns: [
            { key: "kode", header: "Kode", example: "KTN", required: true },
            { key: "nama", header: "Nama", example: "Katun", required: true },
          ],
          action: importKategoriBatch,
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["kategori"] });
            setImportOpen(false);
          },
        }}
      />
    </div>
  );
}
