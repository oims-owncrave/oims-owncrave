"use client";

import { StandarQcTable } from "./StandarQcTable";
import type { StandarQcRow } from "@/services/standar-qc";
import { useStandarQcList } from "@/hooks/useStandarQc";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: StandarQcRow[];
}

export function StandarQcPageClient({ initialData }: Props) {
  const { data } = useStandarQcList();
  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Standar QC"
        breadcrumb={[{ label: "Master" }, { label: "Standar QC" }]}
      />
      <StandarQcTable data={items} />
    </div>
  );
}
