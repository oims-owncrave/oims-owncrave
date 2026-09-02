"use client";

import { PbTable } from "./PbTable";
import type { PbListRow } from "@/services/permintaan-bahan";
import { usePermintaanList } from "@/hooks/usePermintaanBahan";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: PbListRow[];
}

export function PbPageClient({ initialData }: Props) {
  const { data } = usePermintaanList();
  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permintaan Bahan"
        breadcrumb={[{ label: "Produksi" }, { label: "Permintaan Bahan" }]}
      />
      <PbTable data={items} />
    </div>
  );
}
