"use client";

import { useState } from "react";
import { LaporanStokTable } from "./LaporanStokTable";
import { useLaporanStok } from "@/hooks/useLaporan";
import type { LaporanStokItem } from "@/services/laporan";

interface Props {
  initialData?: {
    items: LaporanStokItem[];
    totalNilai: number;
  };
  kategoriOptions: { id: string; nama: string }[];
}

export function LaporanStokClient({ initialData, kategoriOptions }: Props) {
  const [kategoriId, setKategoriId] = useState("");

  const { data, isLoading } = useLaporanStok(kategoriId || undefined);

  const items = data?.items ?? initialData?.items ?? [];
  const totalNilai = data?.totalNilai ?? initialData?.totalNilai ?? 0;

  return (
    <div className="space-y-6">
      <LaporanStokTable
        isLoading={isLoading}
        data={items}
        totalNilai={totalNilai}
        kategoriId={kategoriId}
        onKategoriChange={setKategoriId}
        kategoriOptions={kategoriOptions}
      />
    </div>
  );
}
