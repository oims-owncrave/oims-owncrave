"use client";

import { useQuery } from "@tanstack/react-query";
import { listStok } from "@/services/stok";

export type StokFilter = {
  kategoriId?: string;
  kritisOnly?: boolean;
};

export const KEY_STOK = ["stok"];

export function useStokList(filter?: StokFilter) {
  return useQuery({
    queryKey: [...KEY_STOK, filter],
    queryFn: () => listStok(filter),
  });
}
