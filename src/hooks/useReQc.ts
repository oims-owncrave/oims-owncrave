"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import { listSumberReQc, listReQc, createReQc } from "@/services/re-qc";
import type { ReQcInput } from "@/lib/schemas/re-qc";

const SUMBER = ["sumber-re-qc"];
const LIST = ["re-qc"];

export function useSumberReQc() {
  return useQuery({ queryKey: SUMBER, queryFn: () => listSumberReQc() });
}

export function useReQcList() {
  return useQuery({ queryKey: LIST, queryFn: () => listReQc() });
}

export function useReQcMutation() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: SUMBER });
    qc.invalidateQueries({ queryKey: LIST });
    // hasil reject bisa memunculkan kandidat karantina baru
    qc.invalidateQueries({ queryKey: ["reject-belum-karantina"] });
  };

  const create = useMutation({
    mutationFn: (input: ReQcInput) => createReQc(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(
        `Re-QC ${res.data?.nomorDokumen} dicatat (putaran ${res.data?.putaran})`,
        toastStyles.primary,
      );
      invalidate();
    },
  });

  return { create };
}
