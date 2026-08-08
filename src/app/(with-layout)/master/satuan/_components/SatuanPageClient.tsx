"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SatuanTable } from "./SatuanTable";
import { SatuanFormModal } from "./SatuanFormModal";
import { ImportExcelModal } from "@/components/ui/import/ImportExcelModal";
import { useSatuanList, useSatuanMutation } from "@/hooks/useSatuan";
import { importSatuanBatch } from "@/services/import";
import type { Satuan } from "@/db/schema";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: Satuan[];
}

export function SatuanPageClient({ initialData }: Props) {
  const { data = initialData } = useSatuanList();
  const { remove } = useSatuanMutation();
  const qc = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Satuan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Satuan) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Satuan"
        breadcrumb={[{ label: "Master" }, { label: "Satuan" }]}
      />

      <SatuanTable
        data={data}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onImport={() => setImportOpen(true)}
      />

      <SatuanFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingItem}
      />

      <ImportExcelModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={{
          title: "Import Satuan",
          templateFilename: "template-satuan",
          columns: [
            { key: "nama", header: "Nama", example: "Meter", required: true },
            { key: "singkatan", header: "Singkatan", example: "m", required: true },
          ],
          action: importSatuanBatch,
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["satuan"] });
            setImportOpen(false);
          },
        }}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Satuan?"
        message="Satuan yang sudah dipakai oleh bahan tidak dapat dihapus, hanya bisa dinonaktifkan."
        confirmLabel="Hapus"
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        loading={remove.isPending}
      />
    </div>
  );
}
