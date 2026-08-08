"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SupplierTable } from "./SupplierTable";
import { SupplierFormModal } from "./SupplierFormModal";
import { ImportExcelModal } from "@/components/ui/import/ImportExcelModal";
import type { Supplier } from "@/db/schema";
import { useSupplierList } from "@/hooks/useSupplier";
import { importSupplierBatch } from "@/services/import";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: Supplier[];
}

export function SupplierPageClient({ initialData }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const { data } = useSupplierList();
  const qc = useQueryClient();

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
        onImport={() => setImportOpen(true)}
      />

      <SupplierFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editItem}
      />

      <ImportExcelModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={{
          title: "Import Supplier",
          templateFilename: "template-supplier",
          columns: [
            { key: "kode", header: "Kode", example: "SUP-001", required: true },
            { key: "nama", header: "Nama", example: "PT Tekstil Jaya", required: true },
            { key: "kontak", header: "Kontak", example: "08123456789", required: false },
            { key: "alamat", header: "Alamat", example: "Jl. Industri No. 12, Bandung", required: false },
          ],
          action: importSupplierBatch,
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["supplier"] });
            setImportOpen(false);
          },
        }}
      />
    </div>
  );
}
