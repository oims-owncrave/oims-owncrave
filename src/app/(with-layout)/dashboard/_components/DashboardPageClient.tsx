"use client";

import { StatCards } from "./StatCards";
import { PerluPerhatian } from "./PerluPerhatian";
import { AktivitasTransaksi } from "./AktivitasTransaksi";
import { TopBahanKeluar } from "./TopBahanKeluar";
import {
  useDashboardStats,
  useBahanKritisList,
  useTopBahanKeluar,
} from "@/hooks/useDashboard";
import type {
  DashboardStats,
  BahanKritisItem,
  AktivitasTransaksiData,
  Top10BahanKeluarItem,
} from "@/services/dashboard";

interface Props {
  initialStats: DashboardStats;
  initialKritisList: BahanKritisItem[];
  initialAktivitas: AktivitasTransaksiData;
  initialTopBahan: Top10BahanKeluarItem[];
}

export function DashboardPageClient({
  initialStats,
  initialKritisList,
  initialAktivitas,
  initialTopBahan,
}: Props) {
  const { data: stats = initialStats } = useDashboardStats(initialStats);
  const { data: kritisList = initialKritisList } = useBahanKritisList(initialKritisList);
  const { data: topBahan = initialTopBahan } = useTopBahanKeluar(initialTopBahan);

  return (
    <div className="space-y-6 mt-5 sm:mt-0">
      <StatCards stats={stats} />

      {/* Aktivitas full-width */}
      <AktivitasTransaksi initialData={initialAktivitas} />

      {/* Top Bahan + Perlu Perhatian side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopBahanKeluar data={topBahan} />
        <PerluPerhatian
          kritisList={kritisList}
          penyesuaianPending={stats.penyesuaianPending}
        />
      </div>
    </div>
  );
}
