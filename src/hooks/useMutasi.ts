"use client";

import { useQuery } from "@tanstack/react-query";
import { listMutasi } from "@/services/mutasi";
import type { MutasiFilter } from "@/services/mutasi";

export const KEY_MUTASI = ["mutasi"];

export function useMutasiList(filter?: MutasiFilter, page = 1) {
  return useQuery({
    queryKey: [...KEY_MUTASI, filter, page],
    queryFn: () => listMutasi(filter, page),
  });
}
