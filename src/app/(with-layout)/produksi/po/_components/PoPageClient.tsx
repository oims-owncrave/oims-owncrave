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
        title="Order Produksi"
        breadcrumb={[{ label: "Produksi" }, { label: "Order Produksi" }]}
      />
      <PoTable data={items} />
    </div>
  );
}
