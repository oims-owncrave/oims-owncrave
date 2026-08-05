"use client";

import { useState } from "react";
import { LaporanMutasiTable } from "./LaporanMutasiTable";
import { useLaporanMutasi } from "@/hooks/useLaporan";
import type { MutasiRow } from "@/services/mutasi";

interface Props {
  initialData: {
    rows: MutasiRow[];
  };
  bahanOptions: { id: string; kode: string; nama: string }[];
}

export function LaporanMutasiClient({ initialData, bahanOptions }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [bahanId, setBahanId] = useState("");

  const { data } = useLaporanMutasi(
    from || undefined,
    to || undefined,
    bahanId || undefined,
  );

  const rows = data?.rows ?? initialData.rows;

  return (
    <div className="space-y-6">
      <LaporanMutasiTable
        data={rows}
        from={from}
        to={to}
        bahanId={bahanId}
        onFromChange={setFrom}
        onToChange={setTo}
        onBahanChange={setBahanId}
        bahanOptions={bahanOptions}
      />
    </div>
  );
}
