"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listPenjahit,
  createPenjahit,
  updatePenjahit,
  softDeletePenjahit,
} from "@/services/penjahit";
import type { PenjahitInput } from "@/lib/schemas/penjahit";

const KEY = ["penjahit"];

export function usePenjahitList() {
  return useQuery({ queryKey: KEY, queryFn: () => listPenjahit() });
}

export function usePenjahitMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: PenjahitInput) => createPenjahit(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Penjahit ditambahkan", toastStyles?.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PenjahitInput }) =>
      updatePenjahit(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Penjahit diperbarui", toastStyles?.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeletePenjahit(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Penjahit dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}
