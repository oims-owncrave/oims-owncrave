"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  DollarSign,
  AlertTriangle,
  ClipboardList,
  Loader2,
} from "lucide-react";
import type { DashboardStats } from "@/services/dashboard";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

interface Props {
  stats: DashboardStats;
}

export function StatCards({ stats }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeHref, setActiveHref] = useState<string | null>(null);

  const handleNavigate = (href: string) => {
    setActiveHref(href);
    startTransition(() => {
      router.push(href);
    });
  };

  const cards = [
    {
      label: "Total Jenis Bahan",
      value: stats.totalBahanAktif.toString(),
      icon: Package,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
      href: "/master/bahan",
    },
    {
      label: "Total Nilai Persediaan",
      value: rupiah(stats.totalNilaiStok),
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300",
      href: "/laporan/nilai-persediaan",
    },
    {
      label: "Stok Kritis",
      value: `${stats.bahanKritis} bahan`,
      icon: AlertTriangle,
      color: stats.bahanKritis > 0
        ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300"
        : "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      href: "/inventory/stok",
    },
    {
      label: "Penyesuaian Pending",
      value: `${stats.penyesuaianPending} pengajuan`,
      icon: ClipboardList,
      color: stats.penyesuaianPending > 0
        ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300"
        : "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      href: "/inventory/penyesuaian",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isLoadingThis = isPending && activeHref === card.href;

        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleNavigate(card.href)}
            disabled={isPending}
            className="group block text-left rounded-[10px] border border-stroke bg-white p-5 shadow-1 transition-all hover:border-primary/50 hover:shadow-2 cursor-pointer dark:border-dark-3 dark:bg-gray-dark dark:shadow-card dark:hover:border-primary/50 disabled:opacity-80"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-5 dark:text-dark-6 group-hover:text-primary transition-colors">
                  {card.label}
                </p>
                <p className="mt-1 text-lg font-bold text-dark dark:text-white lg:text-xl">
                  {card.value}
                </p>
              </div>
              <div className={`rounded-full p-3 transition-transform group-hover:scale-110 ${card.color}`}>
                {isLoadingThis ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Icon size={20} />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
