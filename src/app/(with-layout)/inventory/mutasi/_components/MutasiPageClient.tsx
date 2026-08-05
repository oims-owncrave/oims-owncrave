"use client";

import { useState } from "react";
import { MutasiTable } from "./MutasiTable";
import { useMutasiList } from "@/hooks/useMutasi";
import type { MutasiRow } from "@/services/mutasi";

interface Props {
  initialRows: MutasiRow[];
  initialTotal: number;
  pageSize: number;
  bahanOptions: { id: string; kode: string; nama: string }[];
}

export function MutasiPageClient({
  initialRows,
  initialTotal,
  pageSize,
  bahanOptions,
}: Props) {
  const [page, setPage] = useState(1);
  const [filterBahanId, setFilterBahanId] = useState("");
  const [filterBahanLabel, setFilterBahanLabel] = useState("");
  const [filterTipe, setFilterTipe] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const filter = {
    bahanId: filterBahanId || undefined,
    tipe: filterTipe || undefined,
    from: filterFrom || undefined,
    to: filterTo || undefined,
  };

  const { data } = useMutasiList(filter, page);

  // Use server data if available, else initial SSR data (only on first load without filter)
  const rows = data?.rows ?? initialRows;
  const total = data?.total ?? initialTotal;

  // Reset ke halaman 1 saat filter berubah
  function handleFilterChange(setter: (v: string) => void) {
    return (v: string) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <div className="space-y-6">
      <MutasiTable
        data={rows}
        page={page}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        filterBahanLabel={filterBahanId}
        filterTipe={filterTipe}
        filterFrom={filterFrom}
        filterTo={filterTo}
        bahanOptions={bahanOptions}
        onFilterBahanChange={(id, label) => {
          setFilterBahanId(id);
          setFilterBahanLabel(label);
          setPage(1);
        }}
        onFilterTipeChange={handleFilterChange(setFilterTipe)}
        onFilterFromChange={handleFilterChange(setFilterFrom)}
        onFilterToChange={handleFilterChange(setFilterTo)}
      />
    </div>
  );
}
