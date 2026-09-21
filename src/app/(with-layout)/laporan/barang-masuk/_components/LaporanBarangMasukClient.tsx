"use client";

import { useState } from "react";
import { LaporanBarangMasukTable } from "./LaporanBarangMasukTable";
import { useLaporanBarangMasuk } from "@/hooks/useLaporan";
import type { LaporanMasukItem } from "@/services/laporan";

interface Props {
  initialData?: {
    items: LaporanMasukItem[];
    totalKuantitas: number;
    totalNilai: number;
  };
}

export function LaporanBarangMasukClient({ initialData }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading } = useLaporanBarangMasuk(from || undefined, to || undefined);

  const items = data?.items ?? initialData?.items ?? [];
  const totalKuantitas = data?.totalKuantitas ?? initialData?.totalKuantitas ?? 0;
  const totalNilai = data?.totalNilai ?? initialData?.totalNilai ?? 0;

  return (
    <div className="space-y-6">
      <LaporanBarangMasukTable
        isLoading={isLoading}
        data={items}
        totalKuantitas={totalKuantitas}
        totalNilai={totalNilai}
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
      />
    </div>
  );
}
