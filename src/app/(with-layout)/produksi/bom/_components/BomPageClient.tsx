"use client";

import { BomTable } from "./BomTable";
import type { BomListRow } from "@/services/bom";
import { useBomList } from "@/hooks/useBom";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: BomListRow[];
}

export function BomPageClient({ initialData }: Props) {
  const { data } = useBomList();
  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bill of Materials"
        breadcrumb={[{ label: "Produksi" }, { label: "BOM" }]}
      />
      <BomTable data={items} />
    </div>
  );
}
