"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import type { AlurProduksi as Data } from "@/services/alur-produksi";

interface Props {
  data: Data;
}

type Tahap = {
  label: string;
  value: number | null;
  satuan: string;
  href?: string;
  hint?: string;
};

/**
 * Alur produksi lintas tahap (pola dashboard owner app lama, referensi §11).
 * Owner lihat "barang saya lagi di mana", bukan blok terpisah per tahap.
 * Kolom QC & Stok Jadi menyusul di Tahap 4.
 */
export function AlurProduksi({ data }: Props) {
  const router = useRouter();
  const [, startNavigate] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const go = (href?: string) => {
    if (!href) return;
    setPendingHref(href);
    startNavigate(() => router.push(href));
  };

  const tahap: Tahap[] = [
    { label: "PO Aktif", value: data.poAktif, satuan: "PO", href: "/produksi/po" },
    { label: "Di Area Cutting", value: data.diCutting, satuan: "pcs", href: "/produksi/wip", hint: "belum dibundel" },
    { label: "Antre ke Vendor", value: data.antreJahit, satuan: "pcs", href: "/produksi/bundling", hint: "bundel siap kirim" },
    { label: "Masih di Vendor", value: data.diVendor, satuan: "pcs", href: "/vendor/wip", hint: "sisa WIP jahit" },
    { label: "Selesai Jahit", value: data.siapQc, satuan: "pcs", href: "/vendor/penerimaan", hint: "siap QC" },
    { label: "Menunggu QC", value: data.menungguQc, satuan: "pcs", hint: "Tahap 4" },
    { label: "Stok Barang Jadi", value: data.stokJadi, satuan: "pcs", hint: "Tahap 4" },
  ];

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      <h3 className="mb-4 font-semibold text-dark dark:text-white">Alur Produksi</h3>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
        {tahap.map((t, i) => {
          const belumAda = t.value === null;
          const clickable = !!t.href && !belumAda;
          return (
            <div key={t.label} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!clickable || pendingHref === t.href}
                onClick={() => go(t.href)}
                className={cn(
                  "relative flex-1 rounded-lg px-3 py-3 text-left transition-colors sm:text-center",
                  clickable && "hover:bg-gray-50 dark:hover:bg-gray-800",
                  belumAda && "opacity-50",
                )}
              >
                {pendingHref === t.href && <Spinner size={14} className="absolute right-2 top-2" />}
                <p className="text-xs text-dark-5 dark:text-dark-6">{t.label}</p>
                <p className={cn("mt-0.5 text-2xl font-bold", belumAda ? "text-dark-5 dark:text-dark-6" : "text-dark dark:text-white")}>
                  {t.value === null ? "—" : t.value.toLocaleString("id-ID")}
                  {!belumAda && <span className="ml-1 text-xs font-normal text-dark-5 dark:text-dark-6">{t.satuan}</span>}
                </p>
                {t.hint && <p className="text-[11px] text-dark-5 dark:text-dark-6">{t.hint}</p>}
              </button>

              {i < tahap.length - 1 && (
                <ChevronRight size={16} className="hidden shrink-0 text-dark-5 dark:text-dark-6 sm:block" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
