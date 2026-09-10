"use client";

import { WoQcTable } from "./WoQcTable";
import type { WoQcRow } from "@/services/wo-qc";
import { useWoQcList } from "@/hooks/useWoQc";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: WoQcRow[];
}

export function WoQcPageClient({ initialData }: Props) {
  const { data } = useWoQcList();
  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Order QC"
        breadcrumb={[{ label: "Quality Control" }, { label: "Work Order QC" }]}
      />
      <WoQcTable data={items} />
    </div>
  );
}
