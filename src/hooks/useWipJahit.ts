"use client";

import { useQuery } from "@tanstack/react-query";
import { getWipJahit, getRingkasanJahit } from "@/services/wip-jahit";

const KEY = ["wip-jahit"];

export function useWipJahit() {
  return useQuery({ queryKey: KEY, queryFn: () => getWipJahit() });
}

export function useRingkasanJahit() {
  return useQuery({ queryKey: [...KEY, "ringkasan"], queryFn: () => getRingkasanJahit() });
}
