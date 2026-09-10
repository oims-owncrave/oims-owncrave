"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import { listBiaya, getBiayaDetail, updateBiaya, setBiayaStatus, terapkanUsulan } from "@/services/biaya-jasa-jahit";
import type { BiayaInput, BiayaStatus } from "@/lib/schemas/biaya-jasa-jahit";

const KEY = ["biaya-jasa-jahit"];

export function useBiayaList() {
  return useQuery({ queryKey: KEY, queryFn: () => listBiaya() });
}

export function useBiayaDetail(penugasanId: string) {
  return useQuery({ queryKey: [...KEY, penugasanId], queryFn: () => getBiayaDetail(penugasanId) });
}

export function useBiayaMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const update = useMutation({
    mutationFn: ({ penugasanId, input }: { penugasanId: string; input: BiayaInput }) => updateBiaya(penugasanId, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Tagihan diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ penugasanId, status }: { penugasanId: string; status: BiayaStatus }) => setBiayaStatus(penugasanId, status),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Status tagihan diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const usulan = useMutation({
    mutationFn: (penugasanId: string) => terapkanUsulan(penugasanId),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Usulan diterapkan", toastStyles.primary);
      invalidate();
    },
  });

  return { update, setStatus, usulan };
}
