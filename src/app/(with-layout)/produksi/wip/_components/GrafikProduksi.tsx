"use client";

import { cn } from "@/lib/utils";
import { LIMBAH_JENIS } from "@/lib/schemas/sisa-limbah";
import type { GrafikProduksi as GrafikData } from "@/services/wip";

/**
 * Grafik dashboard Tahap 2 (PRD §21) — bar CSS murni, tanpa library chart.
 * Ikut pola TopBahanKeluar di dashboard Tahap 1.
 */

const fmtQty = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

function Card({
  title,
  subtitle,
  empty,
  children,
}: {
  title: string;
  subtitle?: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-dark dark:text-white">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{subtitle}</p>
        )}
      </div>
      {empty ? (
        <p className="py-8 text-center text-sm text-dark-5 dark:text-dark-6">
          Belum ada data.
        </p>
      ) : (
        children
      )}
    </div>
  );
}

/** Warna efisiensi: hijau ≥95%, kuning 80-95%, merah <80% */
function efisiensiTone(pct: number) {
  if (pct >= 95) return "bg-green-500";
  if (pct >= 80) return "bg-yellow-500";
  return "bg-red-500";
}

export function GrafikProduksi({ data }: { data: GrafikData }) {
  const { targetHasil, hasilHarian, limbahPerJenis, pemakaian } = data;

  const maxHarian = Math.max(1, ...hasilHarian.map((h) => h.baik + h.rusak));
  const maxLimbahNilai = Math.max(1, ...limbahPerJenis.map((l) => l.nilai));
  const limbahLabel = new Map(LIMBAH_JENIS.map((j) => [j.value as string, j.label]));

  return (
    <div className="grid grid-cols-1 gap-4 min-[850px]:grid-cols-2">
      {/* 1. Target vs hasil + efisiensi per PO */}
      <Card
        title="Target vs Hasil per PO Produksi"
        subtitle="Batang = hasil baik terhadap target cutting; persentase = efisiensi"
        empty={targetHasil.length === 0}
      >
        <ol className="space-y-3">
          {targetHasil.map((r) => {
            const pctBaik = Math.min(100, Math.round((r.baik / r.target) * 100));
            const pctRusak = Math.min(100 - pctBaik, Math.round((r.rusak / r.target) * 100));
            return (
              <li key={r.poId}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-dark dark:text-white">
                    {r.nomorDokumen}
                    <span className="ml-1.5 text-xs font-normal text-dark-5 dark:text-dark-6">
                      {r.produkNama}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-dark dark:text-white">
                    {r.baik}/{r.target}
                    <span
                      className={cn(
                        "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        r.efisiensi >= 95
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : r.efisiensi >= 80
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
                      )}
                    >
                      {r.efisiensi}%
                    </span>
                  </span>
                </div>
                <div className="mt-1 flex h-2 w-full overflow-hidden rounded-full bg-gray-2 dark:bg-dark-3">
                  <div
                    className={cn("h-full transition-all", efisiensiTone(r.efisiensi))}
                    style={{ width: `${pctBaik}%` }}
                    title={`Baik: ${r.baik} pcs`}
                  />
                  {pctRusak > 0 && (
                    <div
                      className="h-full bg-red-300 transition-all dark:bg-red-800"
                      style={{ width: `${pctRusak}%` }}
                      title={`Rusak: ${r.rusak} pcs`}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* 2. Hasil per hari */}
      <Card
        title="Hasil Cutting per Hari"
        subtitle="30 hari terakhir"
        empty={hasilHarian.length === 0}
      >
        <div className="flex h-40 items-end gap-1 overflow-x-auto">
          {hasilHarian.map((h) => {
            const total = h.baik + h.rusak;
            const tinggiBaik = Math.round((h.baik / maxHarian) * 100);
            const tinggiRusak = Math.round((h.rusak / maxHarian) * 100);
            const tgl = new Date(h.tanggal);
            return (
              <div
                key={h.tanggal}
                className="flex min-w-5 flex-1 flex-col items-center justify-end gap-1"
                title={`${tgl.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}: ${h.baik} baik, ${h.rusak} rusak`}
              >
                <span className="text-[9px] text-dark-5 dark:text-dark-6">{total}</span>
                <div className="flex w-full flex-col justify-end" style={{ height: "100%" }}>
                  {tinggiRusak > 0 && (
                    <div
                      className="w-full rounded-t bg-red-300 dark:bg-red-800"
                      style={{ height: `${tinggiRusak}%` }}
                    />
                  )}
                  <div
                    className={cn("w-full bg-primary", tinggiRusak === 0 && "rounded-t")}
                    style={{ height: `${tinggiBaik}%` }}
                  />
                </div>
                <span className="text-[9px] text-dark-5 dark:text-dark-6">
                  {tgl.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3. Limbah per kategori */}
      <Card
        title="Limbah per Jenis"
        subtitle="Bulan berjalan — batang menurut nilai kerugian"
        empty={limbahPerJenis.length === 0}
      >
        <ol className="space-y-2.5">
          {limbahPerJenis
            .slice()
            .sort((a, b) => b.nilai - a.nilai)
            .map((l) => (
              <li key={l.jenis}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm text-dark dark:text-white">
                    {limbahLabel.get(l.jenis) ?? l.jenis}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-red-600 dark:text-red-300">
                    {rupiah(l.nilai)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-2 dark:bg-dark-3">
                  <div
                    className="h-full rounded-full bg-red-400 transition-all dark:bg-red-700"
                    style={{ width: `${Math.round((l.nilai / maxLimbahNilai) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
        </ol>
      </Card>

      {/* 4. Pemakaian standar vs aktual */}
      <Card
        title="Pemakaian Bahan: Standar vs Aktual"
        subtitle="Standar dari BOM × target cutting; selisih positif berarti boros"
        empty={pemakaian.length === 0}
      >
        <ol className="space-y-3">
          {pemakaian.map((p) => {
            const maks = Math.max(p.standar, p.aktual, 1);
            return (
              <li key={p.bahanId}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-dark dark:text-white">
                    {p.bahanKode}
                    <span className="ml-1.5 text-xs font-normal text-dark-5 dark:text-dark-6">
                      {p.bahanNama}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-semibold",
                      p.varians > 0
                        ? "text-red-600 dark:text-red-300"
                        : "text-green-700 dark:text-green-300",
                    )}
                  >
                    {p.varians > 0 ? "+" : ""}
                    {fmtQty(p.varians)} {p.satuanSingkatan}
                  </span>
                </div>

                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-[10px] text-dark-5 dark:text-dark-6">
                      Standar
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-2 dark:bg-dark-3">
                      <div
                        className="h-full rounded-full bg-gray-400 dark:bg-dark-6"
                        style={{ width: `${Math.round((p.standar / maks) * 100)}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-[10px] text-dark-5 dark:text-dark-6">
                      {fmtQty(p.standar)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-[10px] text-dark-5 dark:text-dark-6">
                      Aktual
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-2 dark:bg-dark-3">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          p.varians > 0 ? "bg-red-400 dark:bg-red-700" : "bg-primary",
                        )}
                        style={{ width: `${Math.round((p.aktual / maks) * 100)}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-[10px] text-dark-5 dark:text-dark-6">
                      {fmtQty(p.aktual)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
