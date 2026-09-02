"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listBundel,
  getSisaBundel,
  createBundel,
  setBundelStatus,
} from "@/services/bundling";
import type { BundelInput } from "@/lib/schemas/bundling";

const KEY = ["bundling"];

export function useBundelList() {
  return useQuery({ queryKey: KEY, queryFn: () => listBundel() });
}

export function useSisaBundel(woId: string) {
  return useQuery({
    queryKey: [...KEY, "sisa", woId],
    queryFn: () => getSisaBundel(woId),
    enabled: woId.length > 0,
  });
}

export function useBundelMutation() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ["wo-cutting"] });
  };

  const create = useMutation({
    mutationFn: (input: BundelInput) => createBundel(input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal membuat bundel");
      toast.success(`Bundel ${res.data.nomorDokumen} dibuat`, toastStyles.primary);
      invalidate();
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => setBundelStatus(id, status),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Status bundel diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  return { create, setStatus };
}
