"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listBarisSiapPacking,
  listPacking,
  createPacking,
  updateChecklistPacking,
  updateStatusPacking,
} from "@/services/packing";
import type { PackingInput } from "@/lib/schemas/packing";

const SIAP = ["baris-siap-packing"];
const LIST = ["packing"];

export function useBarisSiapPacking() {
  return useQuery({ queryKey: SIAP, queryFn: () => listBarisSiapPacking() });
}

export function usePackingList() {
  return useQuery({ queryKey: LIST, queryFn: () => listPacking() });
}

export function usePackingMutation() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: SIAP });
    qc.invalidateQueries({ queryKey: LIST });
    qc.invalidateQueries({ queryKey: ["packing-siap-gudang"] });
  };

  const create = useMutation({
    mutationFn: (input: PackingInput) => createPacking(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Packing ${res.data?.nomorDokumen} dibuat`, toastStyles.primary);
      invalidate();
    },
  });

  const setChecklist = useMutation({
    mutationFn: ({ id, checklist }: { id: string; checklist: Record<string, boolean> }) =>
      updateChecklistPacking(id, checklist),
    onSuccess: () => invalidate(),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "berjalan" | "selesai" | "dibatalkan" }) =>
      updateStatusPacking(id, status),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Status packing jadi ${res.data?.status}`, toastStyles.primary);
      invalidate();
    },
  });

  return { create, setChecklist, setStatus };
}
