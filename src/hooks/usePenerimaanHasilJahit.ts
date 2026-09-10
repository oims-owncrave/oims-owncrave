"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listPenerimaanHasil,
  getPenerimaanHasilDetail,
  getRekapPenugasan,
  getSisaRetur,
  createPenerimaanHasil,
  softDeletePenerimaanHasil,
} from "@/services/penerimaan-hasil-jahit";
import type { PenerimaanHasilInput } from "@/lib/schemas/penerimaan-hasil-jahit";

const KEY = ["penerimaan-hasil-jahit"];
const RELATED = [["penugasan-jahit"], ["selisih-jahit"], ["retur-jahit"]];

export function usePenerimaanHasilList() {
  return useQuery({ queryKey: KEY, queryFn: () => listPenerimaanHasil() });
}

export function usePenerimaanHasilDetail(id: string) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => getPenerimaanHasilDetail(id) });
}

export function useRekapPenugasan(penugasanId: string) {
  return useQuery({
    queryKey: [...KEY, "rekap", penugasanId],
    queryFn: () => getRekapPenugasan(penugasanId),
    enabled: !!penugasanId,
  });
}

export function useSisaRetur(returId: string) {
  return useQuery({
    queryKey: [...KEY, "sisa-retur", returId],
    queryFn: () => getSisaRetur(returId),
    enabled: !!returId,
  });
}

export function usePenerimaanHasilMutation() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    RELATED.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  };

  const create = useMutation({
    mutationFn: (input: PenerimaanHasilInput) => createPenerimaanHasil(input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal mencatat penerimaan");
      toast.success(`Penerimaan ${res.data.nomorDokumen} tercatat`, toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeletePenerimaanHasil(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Penerimaan dihapus");
      invalidate();
    },
  });

  return { create, remove };
}
