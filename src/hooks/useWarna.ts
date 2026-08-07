"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listWarna,
  createWarna,
  updateWarna,
  softDeleteWarna,
} from "@/services/warna";
import type { WarnaInput } from "@/lib/schemas/warna";

const KEY = ["warna"];

export function useWarnaList() {
  return useQuery({ queryKey: KEY, queryFn: () => listWarna() });
}

export function useWarnaMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: WarnaInput) => createWarna(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Warna ditambahkan", toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: WarnaInput }) =>
      updateWarna(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Warna diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteWarna(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Warna dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}
