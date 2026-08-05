"use client";

import {
  Package,
  Truck,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Activity,
  ClipboardList,
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
  const cards = [
    {
      label: "Total Jenis Bahan",
      value: stats.totalBahanAktif.toString(),
      icon: Package,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
    },
    {
      label: "Supplier Aktif",
      value: stats.totalSupplierAktif.toString(),
      icon: Truck,
      color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300",
    },
    {
      label: "Total Nilai Persediaan",
      value: rupiah(stats.totalNilaiStok),
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300",
    },
    {
      label: "Barang Masuk (Bulan Ini)",
      value: `${stats.barangMasukBulanIni} transaksi`,
      icon: ArrowDownLeft,
      color: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-300",
    },
    {
      label: "Barang Keluar (Bulan Ini)",
      value: `${stats.barangKeluarBulanIni} transaksi`,
      icon: ArrowUpRight,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300",
    },
    {
      label: "Stok Kritis",
      value: `${stats.bahanKritis} bahan`,
      icon: AlertTriangle,
      color: stats.bahanKritis > 0
        ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300"
        : "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
    {
      label: "Transaksi Hari Ini",
      value: `${stats.transaksiHariIni} transaksi`,
      icon: Activity,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300",
    },
    {
      label: "Penyesuaian Pending",
      value: `${stats.penyesuaianPending} pengajuan`,
      icon: ClipboardList,
      color: stats.penyesuaianPending > 0
        ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300"
        : "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-5 dark:text-dark-6">
                  {card.label}
                </p>
                <p className="mt-1 text-xl font-bold text-dark dark:text-white">
                  {card.value}
                </p>
              </div>
              <div className={`rounded-full p-3 ${card.color}`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
