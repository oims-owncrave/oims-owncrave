"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listAntreanKirimQc,
  listPenerimaanQc,
  createPenerimaanQc,
  softDeletePenerimaanQc,
} from "@/services/penerimaan-qc";
import type { PenerimaanQcInput } from "@/lib/schemas/penerimaan-qc";

const ANTREAN_KEY = ["antrean-qc"];
const DOK_KEY = ["penerimaan-qc"];

export function useAntreanQc() {
  return useQuery({ queryKey: ANTREAN_KEY, queryFn: () => listAntreanKirimQc() });
}

export function usePenerimaanQcList() {
  return useQuery({ queryKey: DOK_KEY, queryFn: () => listPenerimaanQc() });
}

export function usePenerimaanQcMutation() {
  const qc = useQueryClient();
  // antrean ikut di-invalidate: sisa berubah begitu dokumen dibuat
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ANTREAN_KEY });
    qc.invalidateQueries({ queryKey: DOK_KEY });
  };

  const create = useMutation({
    mutationFn: (input: PenerimaanQcInput) => createPenerimaanQc(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Penerimaan QC ${res.data?.nomorDokumen} dibuat`, toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeletePenerimaanQc(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Penerimaan QC dihapus");
      invalidate();
    },
  });

  return { create, remove };
}
