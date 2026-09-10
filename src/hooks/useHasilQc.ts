"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listHasilQc,
  createHasilQc,
  verifikasiHasilQc,
  softDeleteHasilQc,
} from "@/services/hasil-qc";
import type { HasilQcInput } from "@/lib/schemas/hasil-qc";

const KEY = ["hasil-qc"];

export function useHasilQcList() {
  return useQuery({ queryKey: KEY, queryFn: () => listHasilQc() });
}

export function useHasilQcMutation() {
  const qc = useQueryClient();
  // WO ikut berubah: progres diperiksa dihitung dari hasil QC
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ["wo-qc"] });
  };

  const create = useMutation({
    mutationFn: (input: HasilQcInput) => createHasilQc(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Hasil QC ${res.data?.nomorDokumen} dicatat`, toastStyles.primary);
      invalidate();
    },
  });

  const verifikasi = useMutation({
    mutationFn: (id: string) => verifikasiHasilQc(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Hasil QC diverifikasi", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteHasilQc(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Hasil QC dihapus");
      invalidate();
    },
  });

  return { create, verifikasi, remove };
}
