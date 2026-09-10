"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listBarisSiapWo,
  listWoQc,
  createWoQc,
  updateStatusWoQc,
  softDeleteWoQc,
} from "@/services/wo-qc";
import type { WoQcInput } from "@/lib/schemas/wo-qc";

const WO_KEY = ["wo-qc"];
const SIAP_KEY = ["baris-siap-wo"];

export function useBarisSiapWo() {
  return useQuery({ queryKey: SIAP_KEY, queryFn: () => listBarisSiapWo() });
}

export function useWoQcList() {
  return useQuery({ queryKey: WO_KEY, queryFn: () => listWoQc() });
}

export function useWoQcMutation() {
  const qc = useQueryClient();
  // kandidat WO ikut berubah begitu WO dibuat/dibatalkan
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: WO_KEY });
    qc.invalidateQueries({ queryKey: SIAP_KEY });
  };

  const create = useMutation({
    mutationFn: (input: WoQcInput) => createWoQc(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Work Order ${res.data?.nomorDokumen} dibuat`, toastStyles.primary);
      invalidate();
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "berjalan" | "selesai" | "dibatalkan" }) =>
      updateStatusWoQc(id, status),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Status WO jadi ${res.data?.status}`, toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteWoQc(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Work Order QC dihapus");
      invalidate();
    },
  });

  return { create, setStatus, remove };
}
