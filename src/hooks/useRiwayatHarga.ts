"use client";

import { useQuery } from "@tanstack/react-query";
import { getRiwayatHargaBahan } from "@/services/barang-masuk";

export function useRiwayatHarga(bahanId: string | null | undefined) {
  return useQuery({
    queryKey: ["riwayat-harga", bahanId],
    queryFn: () => getRiwayatHargaBahan(bahanId!),
    enabled: Boolean(bahanId),
    staleTime: 60_000, // 60 detik
  });
}
