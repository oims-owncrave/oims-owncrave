"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getBahanKritisList } from "@/services/dashboard";
import type { DashboardStats, BahanKritisItem } from "@/services/dashboard";

export const KEY_DASHBOARD = ["dashboard-stats"];

export function useDashboardStats(initialData?: DashboardStats) {
  return useQuery({
    queryKey: KEY_DASHBOARD,
    queryFn: getDashboardStats,
    staleTime: 30_000, // 30 detik
    initialData,
  });
}

export function useBahanKritisList(initialData?: BahanKritisItem[]) {
  return useQuery({
    queryKey: [...KEY_DASHBOARD, "kritis"],
    queryFn: getBahanKritisList,
    staleTime: 30_000,
    initialData,
  });
}
