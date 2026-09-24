"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { BomTable } from "./BomTable";
import type { BomListRow } from "@/services/bom";
import { useBomList } from "@/hooks/useBom";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImportExcelModal } from "@/components/ui/import/ImportExcelModal";
import { importBomBatch } from "@/services/import";
import { BOM_IMPORT_COLUMNS } from "@/lib/import/bom-columns";

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
          columns: BOM_IMPORT_COLUMNS,
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
