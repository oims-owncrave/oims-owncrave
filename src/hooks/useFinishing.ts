"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listBarisSiapFinishing,
  listFinishing,
  createFinishing,
  updateProsesFinishing,
  catatPemakaianFinishing,
  updateStatusFinishing,
} from "@/services/finishing";
import type { FinishingInput, FinishingPemakaianInput } from "@/lib/schemas/finishing";

const SIAP = ["baris-siap-finishing"];
const LIST = ["finishing"];

export function useBarisSiapFinishing() {
  return useQuery({ queryKey: SIAP, queryFn: () => listBarisSiapFinishing() });
}

export function useFinishingList() {
  return useQuery({ queryKey: LIST, queryFn: () => listFinishing() });
}

export function useFinishingMutation(detailId?: string | null) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: SIAP });
    qc.invalidateQueries({ queryKey: LIST });
    qc.invalidateQueries({ queryKey: ["baris-siap-packing"] });
    if (detailId) qc.invalidateQueries({ queryKey: ["finishing-detail", detailId] });
  };

  const create = useMutation({
    mutationFn: (input: FinishingInput) => createFinishing(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Finishing ${res.data?.nomorDokumen} dibuat`, toastStyles.primary);
      invalidate();
    },
  });

  const setProses = useMutation({
    mutationFn: ({ id, proses }: { id: string; proses: Record<string, boolean> }) =>
      updateProsesFinishing(id, proses),
    onSuccess: () => invalidate(),
  });

  const pakaiBahan = useMutation({
    mutationFn: (input: FinishingPemakaianInput) => catatPemakaianFinishing(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Pemakaian dicatat — stok bahan berkurang", toastStyles.primary);
      invalidate();
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "berjalan" | "selesai" | "dibatalkan" }) =>
      updateStatusFinishing(id, status),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Status finishing jadi ${res.data?.status}`, toastStyles.primary);
      invalidate();
    },
  });

  return { create, setProses, pakaiBahan, setStatus };
}
