"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listBom,
  getBomDetail,
  createBom,
  updateBom,
  activateBom,
  deactivateBom,
  createNewVersion,
  softDeleteBom,
} from "@/services/bom";
import type { BomInput } from "@/lib/schemas/bom";

const KEY = ["bom"];

export function useBomList() {
  return useQuery({ queryKey: KEY, queryFn: () => listBom() });
}

export function useBomDetail(id: string) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => getBomDetail(id) });
}

export function useBomMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: BomInput) => createBom(input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal membuat BOM");
      toast.success(`BOM ${res.data.nomorDokumen} dibuat (draft)`, toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: BomInput }) =>
      updateBom(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("BOM diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const activate = useMutation({
    mutationFn: (id: string) => activateBom(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("BOM diaktifkan — versi aktif lama otomatis nonaktif", toastStyles.primary);
      invalidate();
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => deactivateBom(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("BOM dinonaktifkan", toastStyles.primary);
      invalidate();
    },
  });

  const newVersion = useMutation({
    mutationFn: (id: string) => createNewVersion(id),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal membuat versi baru");
      toast.success(`Versi ${res.data.versi} (draft) dibuat`, toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteBom(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("BOM dihapus");
      invalidate();
    },
  });

  return { create, update, activate, deactivate, newVersion, remove };
}
