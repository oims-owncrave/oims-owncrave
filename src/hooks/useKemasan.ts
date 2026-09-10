"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listKemasan,
  createKemasan,
  updateKemasan,
  softDeleteKemasan,
} from "@/services/kemasan";
import type { KemasanInput } from "@/lib/schemas/kemasan";

const KEY = ["kemasan"];

export function useKemasanList() {
  return useQuery({ queryKey: KEY, queryFn: () => listKemasan() });
}

export function useKemasanMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: KemasanInput) => createKemasan(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Kemasan ditambahkan", toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: KemasanInput }) =>
      updateKemasan(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Kemasan diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteKemasan(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Kemasan dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}
