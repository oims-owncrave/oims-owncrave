"use client";

import { useQuery } from "@tanstack/react-query";
import { getWipCutting, getRingkasanProduksi } from "@/services/wip";

export function useWipCutting() {
  return useQuery({ queryKey: ["wip"], queryFn: () => getWipCutting() });
}

export function useRingkasanProduksi() {
  return useQuery({ queryKey: ["wip", "ringkasan"], queryFn: () => getRingkasanProduksi() });
}
