"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ClipboardList, ArrowRight, Loader2 } from "lucide-react";
import type { BahanKritisItem } from "@/services/dashboard";

interface Props {
  kritisList: BahanKritisItem[];
  penyesuaianPending: number;
}

export function PerluPerhatian({ kritisList, penyesuaianPending }: Props) {
  const router = useRouter();
  const [isNavigating, startNavigating] = useTransition();
  const [activeHref, setActiveHref] = useState<string | null>(null);

  const handleNavigate = (href: string) => {
    setActiveHref(href);
    startNavigating(() => {
      router.push(href);
    });
  };

  const isLoadingStok = isNavigating && activeHref === "/inventory/stok";
  const isLoadingPenyesuaian = isNavigating && activeHref === "/inventory/penyesuaian";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Panel 1: Stok Kritis */}
      <button
        type="button"
        onClick={() => handleNavigate("/inventory/stok")}
        disabled={isNavigating}
        className="group text-left block rounded-[10px] border border-stroke bg-white p-6 shadow-1 transition-all hover:border-primary/50 hover:shadow-2 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card dark:hover:border-primary/50 disabled:opacity-80"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-red-50 p-2 text-red-600 transition-transform group-hover:scale-110 dark:bg-red-900/20 dark:text-red-300">
              {isLoadingStok ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <AlertTriangle size={18} />
              )}
            </div>
            <h3 className="font-bold text-dark transition-colors group-hover:text-primary dark:text-white dark:group-hover:text-primary">
              Bahan Stok Kritis ({kritisList.length})
            </h3>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            {isLoadingStok ? (
              <span className="flex items-center gap-1">
                Memuat... <Loader2 size={14} className="animate-spin" />
              </span>
            ) : (
              <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                Lihat Stok <ArrowRight size={14} />
              </span>
            )}
          </span>
        </div>

        {kritisList.length === 0 ? (
          <p className="py-6 text-center text-sm text-dark-5 dark:text-dark-6">
            Semua bahan dalam kondisi stok aman.
          </p>
        ) : (
          <div className="divide-y divide-stroke dark:divide-dark-3">
            {kritisList.map((item) => {
              const qty = Number(item.kuantitas);
              const min = Number(item.stokMinimum);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-dark dark:text-white">
                      <span className="font-mono text-xs text-dark-5 dark:text-dark-6">
                        {item.kode}
                      </span>{" "}
                      {item.nama}
                    </p>
                    <p className="text-xs text-dark-5 dark:text-dark-6">
                      Kategori: {item.kategoriNama || "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-red-600 dark:text-red-400">
                      {qty.toLocaleString("id-ID", { maximumFractionDigits: 3 })}{" "}
                      {item.satuanSingkatan || ""}
                    </p>
                    <p className="text-xs text-dark-5 dark:text-dark-6">
                      Min: {min.toLocaleString("id-ID", { maximumFractionDigits: 3 })}{" "}
                      {item.satuanSingkatan || ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </button>

      {/* Panel 2: Penyesuaian Pending */}
      <button
        type="button"
        onClick={() => handleNavigate("/inventory/penyesuaian")}
        disabled={isNavigating}
        className="group text-left flex flex-col justify-between rounded-[10px] border border-stroke bg-white p-6 shadow-1 transition-all hover:border-primary/50 hover:shadow-2 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card dark:hover:border-primary/50 disabled:opacity-80"
      >
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-amber-50 p-2 text-amber-600 transition-transform group-hover:scale-110 dark:bg-amber-900/20 dark:text-amber-300">
                {isLoadingPenyesuaian ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ClipboardList size={18} />
                )}
              </div>
              <h3 className="font-bold text-dark transition-colors group-hover:text-primary dark:text-white dark:group-hover:text-primary">
                Persetujuan Penyesuaian
              </h3>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-primary">
              {isLoadingPenyesuaian ? (
                <span className="flex items-center gap-1">
                  Memuat... <Loader2 size={14} className="animate-spin" />
                </span>
              ) : (
                <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  Buka Penyesuaian <ArrowRight size={14} />
                </span>
              )}
            </span>
          </div>

          <div className="my-4 rounded-lg bg-gray-50 p-5 dark:bg-dark-2">
            <p className="text-sm text-dark-5 dark:text-dark-6">
              Pengajuan penyesuaian stok yang menunggu persetujuan Owner:
            </p>
            <p className="mt-2 text-3xl font-extrabold text-dark dark:text-white">
              {penyesuaianPending}{" "}
              <span className="text-base font-normal text-dark-5 dark:text-dark-6">
                pengajuan
              </span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-1 text-sm font-semibold text-primary">
          {isLoadingPenyesuaian ? (
            <>
              <span>Memuat...</span>
              <Loader2 size={16} className="animate-spin" />
            </>
          ) : (
            <>
              <span>Buka Halaman Penyesuaian</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </>
          )}
        </div>
      </button>
    </div>
  );
}
