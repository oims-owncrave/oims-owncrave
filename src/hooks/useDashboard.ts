"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getBahanKritisList } from "@/services/dashboard";

export const KEY_DASHBOARD = ["dashboard-stats"];

export function useDashboardStats() {
  return useQuery({
    queryKey: KEY_DASHBOARD,
    queryFn: getDashboardStats,
    staleTime: 30_000, // 30 detik
  });
}

export function useBahanKritisList() {
  return useQuery({
    queryKey: [...KEY_DASHBOARD, "kritis"],
    queryFn: getBahanKritisList,
    staleTime: 30_000,
  });
}
