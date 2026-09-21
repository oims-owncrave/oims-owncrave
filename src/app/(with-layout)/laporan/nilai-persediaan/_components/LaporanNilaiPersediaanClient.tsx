"use client";

import { LaporanNilaiPersediaanTable } from "./LaporanNilaiPersediaanTable";
import { useLaporanNilaiPersediaan } from "@/hooks/useLaporan";
import type { LaporanNilaiPersediaanKategori } from "@/services/laporan";

interface Props {
  initialData?: {
    items: LaporanNilaiPersediaanKategori[];
    totalOverall: number;
  };
}

export function LaporanNilaiPersediaanClient({ initialData }: Props) {
  const { data, isLoading } = useLaporanNilaiPersediaan();

  const items = data?.items ?? initialData?.items ?? [];
  const totalOverall = data?.totalOverall ?? initialData?.totalOverall ?? 0;

  return (
    <div className="space-y-6">
      <LaporanNilaiPersediaanTable
        isLoading={isLoading}
        data={items}
        totalOverall={totalOverall}
      />
    </div>
  );
}
