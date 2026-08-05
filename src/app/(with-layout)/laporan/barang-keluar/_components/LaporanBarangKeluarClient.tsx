"use client";

import { useState } from "react";
import { LaporanBarangKeluarTable } from "./LaporanBarangKeluarTable";
import { useLaporanBarangKeluar } from "@/hooks/useLaporan";
import type { LaporanKeluarItem } from "@/services/laporan";

interface Props {
  initialData: {
    items: LaporanKeluarItem[];
    totalKuantitas: number;
    totalNilai: number;
  };
}

export function LaporanBarangKeluarClient({ initialData }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data } = useLaporanBarangKeluar(from || undefined, to || undefined);

  const items = data?.items ?? initialData.items;
  const totalKuantitas = data?.totalKuantitas ?? initialData.totalKuantitas;
  const totalNilai = data?.totalNilai ?? initialData.totalNilai;

  return (
    <div className="space-y-6">
      <LaporanBarangKeluarTable
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
