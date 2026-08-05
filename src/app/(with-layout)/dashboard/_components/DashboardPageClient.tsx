"use client";

import { StatCards } from "./StatCards";
import { PerluPerhatian } from "./PerluPerhatian";
import { useDashboardStats, useBahanKritisList } from "@/hooks/useDashboard";
import type { DashboardStats, BahanKritisItem } from "@/services/dashboard";

interface Props {
  initialStats: DashboardStats;
  initialKritisList: BahanKritisItem[];
}

export function DashboardPageClient({
  initialStats,
  initialKritisList,
}: Props) {
  const { data: stats = initialStats } = useDashboardStats(initialStats);
  const { data: kritisList = initialKritisList } = useBahanKritisList(initialKritisList);

  return (
    <div className="space-y-6">
      <StatCards stats={stats} />
      <PerluPerhatian
        kritisList={kritisList}
        penyesuaianPending={stats.penyesuaianPending}
      />
    </div>
  );
}
