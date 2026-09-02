"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listWo,
  getWoDetail,
  createWo,
  updateWo,
  setWoStatus,
  softDeleteWo,
  listPemakaian,
  getDiterimaPerBahan,
  upsertPemakaian,
  softDeletePemakaian,
  listHasil,
  getRekapHasil,
  createHasil,
  softDeleteHasil,
} from "@/services/wo-cutting";
import type { WoInput, PemakaianInput, HasilInput } from "@/lib/schemas/wo-cutting";

const KEY = ["wo-cutting"];

export function useWoList() {
  return useQuery({ queryKey: KEY, queryFn: () => listWo() });
}

export function useWoDetail(id: string) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => getWoDetail(id) });
}

export function usePemakaianList(woId: string) {
  return useQuery({ queryKey: [...KEY, woId, "pemakaian"], queryFn: () => listPemakaian(woId) });
}

export function useDiterimaPerBahan(woId: string) {
  return useQuery({ queryKey: [...KEY, woId, "diterima"], queryFn: () => getDiterimaPerBahan(woId) });
}

export function useHasilList(woId: string) {
  return useQuery({ queryKey: [...KEY, woId, "hasil"], queryFn: () => listHasil(woId) });
}

export function useRekapHasil(woId: string) {
  return useQuery({ queryKey: [...KEY, woId, "rekap"], queryFn: () => getRekapHasil(woId) });
}

export function useWoMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: WoInput) => createWo(input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal membuat WO");
      toast.success(`WO ${res.data.nomorDokumen} dibuat (draft)`, toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: WoInput }) => updateWo(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("WO diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => setWoStatus(id, status),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Status WO diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteWo(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("WO dihapus");
      invalidate();
    },
  });

  return { create, update, setStatus, remove };
}

export function usePemakaianMutation(woId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const upsert = useMutation({
    mutationFn: (input: PemakaianInput) => upsertPemakaian(woId, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Pemakaian bahan tercatat", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeletePemakaian(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Pemakaian dihapus");
      invalidate();
    },
  });

  return { upsert, remove };
}

export function useHasilMutation(woId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: HasilInput) => createHasil(woId, input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal mencatat hasil");
      toast.success(`Hasil ${res.data.nomorDokumen} tercatat`, toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteHasil(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Dokumen hasil dihapus");
      invalidate();
    },
  });

  return { create, remove };
}
