"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listSelisih,
  listDetailUntukSelisih,
  createSelisih,
  updateSelisih,
  setSelisihDiselidiki,
  putuskanSelisih,
  softDeleteSelisih,
} from "@/services/selisih-jahit";
import type { SelisihInput, KeputusanInput } from "@/lib/schemas/selisih-jahit";

const KEY = ["selisih-jahit"];

export function useSelisihList() {
  return useQuery({ queryKey: KEY, queryFn: () => listSelisih() });
}

export function useDetailUntukSelisih(enabled = true) {
  return useQuery({ queryKey: [...KEY, "detail-opsi"], queryFn: () => listDetailUntukSelisih(), enabled });
}

export function useSelisihMutation() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ["penugasan-jahit"] });
    qc.invalidateQueries({ queryKey: ["penerimaan-hasil-jahit"] });
  };

  const create = useMutation({
    mutationFn: (input: SelisihInput) => createSelisih(input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal membuat kasus");
      toast.success(`Kasus ${res.data.nomorKasus} dibuka`, toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SelisihInput }) => updateSelisih(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Kasus diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const selidiki = useMutation({
    mutationFn: (id: string) => setSelisihDiselidiki(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Kasus ditandai diselidiki", toastStyles.primary);
      invalidate();
    },
  });

  const putuskan = useMutation({
    mutationFn: ({ id, input }: { id: string; input: KeputusanInput }) => putuskanSelisih(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Keputusan tercatat — sisa WIP diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteSelisih(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Kasus dihapus");
      invalidate();
    },
  });

  return { create, update, selidiki, putuskan, remove };
}
