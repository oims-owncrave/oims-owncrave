"use client";

import { PenerimaanQcTable } from "./PenerimaanQcTable";
import { usePenerimaanQcList } from "@/hooks/usePenerimaanQc";
import { PageHeader } from "@/components/ui/PageHeader";

type Rows = Awaited<ReturnType<typeof import("@/services/penerimaan-qc").listPenerimaanQc>>;

interface Props {
  initialData: Rows;
}

export function PenerimaanQcPageClient({ initialData }: Props) {
  const { data } = usePenerimaanQcList();
  const items = data ?? initialData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penerimaan QC"
        breadcrumb={[{ label: "Quality Control" }, { label: "Penerimaan QC" }]}
      />
      <PenerimaanQcTable data={items} />
    </div>
  );
}
