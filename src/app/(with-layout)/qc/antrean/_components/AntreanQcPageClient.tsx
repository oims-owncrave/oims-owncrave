"use client";

import { useState } from "react";
import { AntreanQcTable } from "./AntreanQcTable";
import { KirimQcModal } from "./KirimQcModal";
import type { AntreanQcRow } from "@/services/penerimaan-qc";
import { useAntreanQc } from "@/hooks/usePenerimaanQc";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  initialData: AntreanQcRow[];
}

export function AntreanQcPageClient({ initialData }: Props) {
  // satu penerimaan hasil = satu dokumen IN-QC, jadi modal dibuka per sumber
  const [sumberId, setSumberId] = useState<string | null>(null);
  const { data } = useAntreanQc();

  const items = data ?? initialData;
  const barisSumber = sumberId
    ? items.filter((r) => r.penerimaanHasilId === sumberId)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Antrean QC"
        breadcrumb={[{ label: "Quality Control" }, { label: "Antrean QC" }]}
      />

      <AntreanQcTable data={items} onKirim={(id) => setSumberId(id)} />

      <KirimQcModal
        open={sumberId !== null}
        onClose={() => setSumberId(null)}
        penerimaanHasilId={sumberId}
        baris={barisSumber}
      />
    </div>
  );
}
