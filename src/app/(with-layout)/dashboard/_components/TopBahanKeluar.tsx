"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Top10BahanKeluarItem } from "@/services/dashboard";

interface Props {
  data: Top10BahanKeluarItem[];
}

export function TopBahanKeluar({ data }: Props) {
  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-dark dark:text-white">
          Top 10 Bahan Paling Banyak Keluar
        </h3>
        <Link
          href="/laporan/barang-keluar"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Laporan <ArrowRight size={14} />
        </Link>
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-dark-5 dark:text-dark-6">
          Belum ada data transaksi keluar.
        </p>
      ) : (
        <ol className="space-y-2.5">
          {data.map((item, i) => {
            const maxKeluar = data[0]?.totalKeluar ?? 1;
            const widthPct = Math.round((item.totalKeluar / maxKeluar) * 100);

            return (
              <li key={item.bahanId} className="flex items-center gap-3">
                {/* Rank */}
                <span className="w-5 shrink-0 text-right text-xs font-bold text-dark-5 dark:text-dark-6">
                  {i + 1}
                </span>

                {/* Bar + label */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-dark dark:text-white">
                      {item.nama}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-dark dark:text-white">
                      {item.totalKeluar.toLocaleString("id-ID")}
                      {item.satuanSingkatan && (
                        <span className="ml-1 text-xs font-normal text-dark-5 dark:text-dark-6">
                          {item.satuanSingkatan}
                        </span>
                      )}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-2 dark:bg-dark-3">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
