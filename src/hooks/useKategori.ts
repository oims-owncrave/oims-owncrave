"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listKategori,
  createKategori,
  updateKategori,
  softDeleteKategori,
} from "@/services/kategori";
import type { KategoriInput } from "@/lib/schemas/kategori";

const KEY = ["kategori"];

export function useKategoriList() {
  return useQuery({ queryKey: KEY, queryFn: () => listKategori() });
}

export function useKategoriMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: KategoriInput) => createKategori(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Kategori ditambahkan", toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: KategoriInput }) =>
      updateKategori(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Kategori diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteKategori(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Kategori dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}
