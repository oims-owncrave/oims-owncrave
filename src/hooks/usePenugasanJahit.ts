"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listPenugasan,
  getPenugasanDetail,
  listBundelSiapTugas,
  getTarifUntukBundel,
  createPenugasan,
  updatePenugasan,
  setPenugasanStatus,
  softDeletePenugasan,
} from "@/services/penugasan-jahit";
import type { PenugasanInput } from "@/lib/schemas/penugasan-jahit";

const KEY = ["penugasan-jahit"];

export function usePenugasanList() {
  return useQuery({ queryKey: KEY, queryFn: () => listPenugasan() });
}

export function usePenugasanDetail(id: string) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => getPenugasanDetail(id) });
}

export function useBundelSiapTugas(poId: string, excludePenugasanId?: string) {
  return useQuery({
    queryKey: [...KEY, "bundel-siap", poId, excludePenugasanId ?? ""],
    queryFn: () => listBundelSiapTugas(poId, excludePenugasanId),
    enabled: !!poId,
  });
}

export function useTarifUntukBundel(args: Parameters<typeof getTarifUntukBundel>[0] | null) {
  return useQuery({
    queryKey: [...KEY, "tarif", args],
    queryFn: () => getTarifUntukBundel(args!),
    enabled: !!args && args.bundlingIds.length > 0 && !!(args.vendorId || args.penjahitId),
  });
}

export function usePenugasanMutation() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ["bundling"] });
  };

  const create = useMutation({
    mutationFn: (input: PenugasanInput) => createPenugasan(input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal membuat penugasan");
      toast.success(`Penugasan ${res.data.nomorDokumen} dibuat (draft)`, toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PenugasanInput }) => updatePenugasan(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Penugasan diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => setPenugasanStatus(id, status),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Status penugasan diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeletePenugasan(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Penugasan dihapus");
      invalidate();
    },
  });

  return { create, update, setStatus, remove };
}
