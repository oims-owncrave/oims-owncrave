"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { BomTable } from "./BomTable";
import type { BomListRow } from "@/services/bom";
import { useBomList } from "@/hooks/useBom";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImportExcelModal } from "@/components/ui/import/ImportExcelModal";
import { importBomBatch } from "@/services/import";

interface Props {
  initialData: BomListRow[];
}

export function BomPageClient({ initialData }: Props) {
  const [importOpen, setImportOpen] = useState(false);
  const qc = useQueryClient();
  const { data } = useBomList();
  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bill of Materials"
        breadcrumb={[{ label: "Produksi" }, { label: "BOM" }]}
      />
      <BomTable data={items} onImport={() => setImportOpen(true)} />

      <ImportExcelModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={{
          title: "Import BOM",
          templateFilename: "template-bom",
          columns: [
            { key: "produk", header: "Produk (kode/nama)", example: "NJK", required: true },
            { key: "bahan", header: "Bahan (kode/nama)", example: "BH-KTN-001", required: true },
            { key: "kuantitas", header: "Kuantitas per Pcs", example: "1.8", required: true },
            { key: "toleransi", header: "Toleransi (%)", example: "5", required: false },
            { key: "ukuran", header: "Berlaku Ukuran", example: "M", required: false },
            { key: "keterangan", header: "Keterangan", example: "Bahan utama", required: false },
          ],
          action: importBomBatch,
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["bom"] });
            setImportOpen(false);
          },
        }}
      />
    </div>
  );
}
