"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listPenerimaan,
  getPenerimaanDetail,
  getBkPrefill,
  createPenerimaan,
} from "@/services/penerimaan-cutting";
import type { PenerimaanInput } from "@/lib/schemas/penerimaan-cutting";

const KEY = ["penerimaan-cutting"];

export function usePenerimaanList() {
  return useQuery({ queryKey: KEY, queryFn: () => listPenerimaan() });
}

export function usePenerimaanDetail(id: string) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => getPenerimaanDetail(id) });
}

export function useBkPrefill(barangKeluarId: string) {
  return useQuery({
    queryKey: ["bk-prefill", barangKeluarId],
    queryFn: () => getBkPrefill(barangKeluarId),
    enabled: barangKeluarId.length > 0,
  });
}

export function usePenerimaanMutation() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (input: PenerimaanInput) => createPenerimaan(input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal membuat penerimaan");
      toast.success(`Penerimaan ${res.data.nomorDokumen} tercatat`, toastStyles.primary);
      qc.invalidateQueries({ queryKey: KEY });
    },
  });

  return { create };
}
