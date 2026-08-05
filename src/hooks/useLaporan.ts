"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getLaporanBarangMasuk,
  getLaporanBarangKeluar,
  getLaporanStok,
  getLaporanNilaiPersediaan,
} from "@/services/laporan";
import { listMutasi } from "@/services/mutasi";

export const KEY_LAPORAN = ["laporan"];

export function useLaporanBarangMasuk(from?: string, to?: string) {
  return useQuery({
    queryKey: [...KEY_LAPORAN, "barang-masuk", from, to],
    queryFn: () => getLaporanBarangMasuk(from, to),
  });
}

export function useLaporanBarangKeluar(from?: string, to?: string) {
  return useQuery({
    queryKey: [...KEY_LAPORAN, "barang-keluar", from, to],
    queryFn: () => getLaporanBarangKeluar(from, to),
  });
}

export function useLaporanStok(kategoriId?: string) {
  return useQuery({
    queryKey: [...KEY_LAPORAN, "stok", kategoriId],
    queryFn: () => getLaporanStok(kategoriId),
  });
}

export function useLaporanNilaiPersediaan() {
  return useQuery({
    queryKey: [...KEY_LAPORAN, "nilai-persediaan"],
    queryFn: () => getLaporanNilaiPersediaan(),
  });
}

export function useLaporanMutasi(from?: string, to?: string, bahanId?: string) {
  return useQuery({
    queryKey: [...KEY_LAPORAN, "mutasi", from, to, bahanId],
    queryFn: () => listMutasi({ from, to, bahanId }),
  });
}
