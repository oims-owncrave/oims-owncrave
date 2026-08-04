"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listBahan,
  createBahan,
  updateBahan,
  softDeleteBahan,
} from "@/services/bahan";
import type { BahanInput } from "@/lib/schemas/bahan";

const KEY = ["bahan"];

export function useBahanList() {
  return useQuery({ queryKey: KEY, queryFn: () => listBahan() });
}

export function useBahanMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: BahanInput) => createBahan(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Bahan ditambahkan", toastStyles?.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: BahanInput }) =>
      updateBahan(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Bahan diperbarui", toastStyles?.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteBahan(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Bahan dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}
