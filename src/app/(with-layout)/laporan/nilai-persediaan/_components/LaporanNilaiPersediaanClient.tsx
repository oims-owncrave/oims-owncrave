"use client";

import { LaporanNilaiPersediaanTable } from "./LaporanNilaiPersediaanTable";
import { useLaporanNilaiPersediaan } from "@/hooks/useLaporan";
import type { LaporanNilaiPersediaanKategori } from "@/services/laporan";

interface Props {
  initialData: {
    items: LaporanNilaiPersediaanKategori[];
    totalOverall: number;
  };
}

export function LaporanNilaiPersediaanClient({ initialData }: Props) {
  const { data } = useLaporanNilaiPersediaan();

  const items = data?.items ?? initialData.items;
  const totalOverall = data?.totalOverall ?? initialData.totalOverall;

  return (
    <div className="space-y-6">
      <LaporanNilaiPersediaanTable
        data={items}
        totalOverall={totalOverall}
      />
    </div>
  );
}
