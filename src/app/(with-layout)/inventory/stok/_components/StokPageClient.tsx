"use client";

import { useState } from "react";
import { Package, TrendingDown, AlertTriangle } from "lucide-react";
import { StokTable } from "./StokTable";
import { useStokList } from "@/hooks/useStok";
import type { StokRow, StokSummary } from "@/services/stok";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

interface Props {
  initialRows: StokRow[];
  initialSummary: StokSummary;
  kategoriOptions: { id: string; nama: string }[];
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  variant: "default" | "warning" | "danger";
}) {
  const colors = {
    default: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300",
    danger: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300",
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-dark-5 dark:text-dark-6">{label}</p>
          <p className="mt-1 text-xl font-bold text-dark dark:text-white">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colors[variant]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export function StokPageClient({ initialRows, initialSummary, kategoriOptions }: Props) {
  const [kategoriId, setKategoriId] = useState("");
  const [kritisOnly, setKritisOnly] = useState("");

  const filter = {
    kategoriId: kategoriId || undefined,
    kritisOnly: kritisOnly === "kritis" || undefined,
  };

  const { data } = useStokList(filter);
  const rows = data?.rows ?? initialRows;
  const summary = data?.summary ?? initialSummary;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Jenis Bahan"
          value={summary.totalJenis.toString()}
          icon={Package}
          variant="default"
        />
        <SummaryCard
          label="Total Nilai Persediaan"
          value={rupiah(summary.totalNilai)}
          icon={TrendingDown}
          variant="warning"
        />
        <SummaryCard
          label="Stok Kritis"
          value={`${summary.totalKritis} bahan`}
          icon={AlertTriangle}
          variant={summary.totalKritis > 0 ? "danger" : "default"}
        />
      </div>

      {/* Alert banner jika ada stok kritis */}
      {summary.totalKritis > 0 && kritisOnly !== "kritis" && (
        <div className="flex items-center gap-3 rounded-[10px] border border-red-200 bg-red-50 px-5 py-3 dark:border-red-800/50 dark:bg-red-900/20">
          <AlertTriangle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-300">
            <span className="font-semibold">{summary.totalKritis} bahan</span> memiliki stok di bawah atau sama dengan batas minimum.{" "}
            <button
              onClick={() => setKritisOnly("kritis")}
              className="underline hover:no-underline"
            >
              Lihat stok kritis
            </button>
          </p>
        </div>
      )}

      <StokTable
        data={rows}
        kategoriId={kategoriId}
        kritisOnly={kritisOnly}
        kategoriOptions={kategoriOptions}
        onKategoriChange={setKategoriId}
        onKritisChange={setKritisOnly}
      />
    </div>
  );
}
