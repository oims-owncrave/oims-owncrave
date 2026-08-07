"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  getBahanKritisList,
  getAktivitasTransaksi,
  getTop10BahanKeluar,
} from "@/services/dashboard";
import type {
  DashboardStats,
  BahanKritisItem,
  AktivitasTransaksiData,
  Top10BahanKeluarItem,
} from "@/services/dashboard";

export const KEY_DASHBOARD = ["dashboard-stats"];

export function useDashboardStats(initialData?: DashboardStats) {
  return useQuery({
    queryKey: KEY_DASHBOARD,
    queryFn: getDashboardStats,
    staleTime: 30_000,
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

export function useAktivitasTransaksi(
  from: string,
  to: string,
  initialData?: AktivitasTransaksiData,
) {
  return useQuery({
    queryKey: [...KEY_DASHBOARD, "aktivitas", from, to],
    queryFn: () => getAktivitasTransaksi(from, to),
    staleTime: 30_000,
    // initialData hanya berlaku kalau range cocok dengan SSR (bulan ini)
    initialData: undefined,
    placeholderData: initialData,
  });
}

export function useTopBahanKeluar(initialData?: Top10BahanKeluarItem[]) {
  return useQuery({
    queryKey: [...KEY_DASHBOARD, "top-bahan-keluar"],
    queryFn: getTop10BahanKeluar,
    staleTime: 30_000,
    initialData,
  });
}
