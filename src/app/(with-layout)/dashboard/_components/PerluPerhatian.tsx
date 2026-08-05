"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ClipboardList, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { BahanKritisItem } from "@/services/dashboard";

interface Props {
  kritisList: BahanKritisItem[];
  penyesuaianPending: number;
}

export function PerluPerhatian({ kritisList, penyesuaianPending }: Props) {
  const router = useRouter();
  const [isNavigatingStok, startNavStok] = useTransition();
  const [isNavigatingPenyesuaian, startNavPenyesuaian] = useTransition();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Panel 1: Stok Kritis */}
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-red-50 p-2 text-red-600 dark:bg-red-900/20 dark:text-red-300">
              <AlertTriangle size={18} />
            </div>
            <h3 className="font-bold text-dark dark:text-white">
              Bahan Stok Kritis ({kritisList.length})
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            loading={isNavigatingStok}
            onClick={() =>
              startNavStok(() => router.push("/inventory/stok"))
            }
          >
            Lihat Stok <ArrowRight size={14} className="ml-1" />
          </Button>
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
      </div>

      {/* Panel 2: Penyesuaian Pending */}
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card flex flex-col justify-between">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-amber-50 p-2 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300">
                <ClipboardList size={18} />
              </div>
              <h3 className="font-bold text-dark dark:text-white">
                Persetujuan Penyesuaian
              </h3>
            </div>
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

        <div className="mt-4 flex justify-end">
          <Button
            loading={isNavigatingPenyesuaian}
            onClick={() =>
              startNavPenyesuaian(() =>
                router.push("/inventory/penyesuaian")
              )
            }
          >
            Buka Halaman Penyesuaian <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
