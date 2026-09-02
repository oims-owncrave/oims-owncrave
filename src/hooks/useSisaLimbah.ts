"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listSisa,
  createSisa,
  setSisaStatus,
  terimaSisaDiGudang,
  softDeleteSisa,
  listLimbah,
  createLimbah,
  softDeleteLimbah,
} from "@/services/sisa-limbah";
import type { SisaInput, LimbahInput } from "@/lib/schemas/sisa-limbah";

const KEY = ["sisa-limbah"];

export function useSisaList(woId: string) {
  return useQuery({ queryKey: [...KEY, woId, "sisa"], queryFn: () => listSisa(woId) });
}

export function useLimbahList(woId: string) {
  return useQuery({ queryKey: [...KEY, woId, "limbah"], queryFn: () => listLimbah(woId) });
}

export function useSisaMutation(woId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ["stok"] });
  };

  const create = useMutation({
    mutationFn: (input: SisaInput) => createSisa(woId, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Sisa bahan tercatat", toastStyles.primary);
      invalidate();
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => setSisaStatus(id, status),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Status sisa diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const terima = useMutation({
    mutationFn: (id: string) => terimaSisaDiGudang(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Sisa diterima gudang — stok bertambah via mutasi retur", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteSisa(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Sisa dihapus");
      invalidate();
    },
  });

  return { create, setStatus, terima, remove };
}

export function useLimbahMutation(woId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: LimbahInput) => createLimbah(woId, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Limbah tercatat", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteLimbah(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Limbah dihapus");
      invalidate();
    },
  });

  return { create, remove };
}
