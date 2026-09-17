"use client";

import { PoTable } from "./PoTable";
import type { PoListRow } from "@/services/po-produksi";
import { usePoList } from "@/hooks/usePoProduksi";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: PoListRow[];
}

export function PoPageClient({ initialData }: Props) {
  const { data } = usePoList();
  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="PO Produksi"
        breadcrumb={[{ label: "Produksi" }, { label: "PO Produksi" }]}
      />
      <PoTable data={items} />
    </div>
  );
}
