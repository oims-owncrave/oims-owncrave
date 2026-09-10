"use client";

import { HasilQcTable } from "./HasilQcTable";
import type { HasilQcRow } from "@/services/hasil-qc";
import { useHasilQcList } from "@/hooks/useHasilQc";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: HasilQcRow[];
}

export function HasilQcPageClient({ initialData }: Props) {
  const { data } = useHasilQcList();
  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pemeriksaan QC"
        breadcrumb={[{ label: "Quality Control" }, { label: "Pemeriksaan QC" }]}
      />
      <HasilQcTable data={items} />
    </div>
  );
}
