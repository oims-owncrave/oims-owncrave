"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listGudangBarangJadi,
  createGudangBarangJadi,
  updateGudangBarangJadi,
  softDeleteGudangBarangJadi,
} from "@/services/gudang-barang-jadi";
import type { GudangBarangJadiInput } from "@/lib/schemas/gudang-barang-jadi";

const KEY = ["gudang-barang-jadi"];

export function useGudangBarangJadiList() {
  return useQuery({ queryKey: KEY, queryFn: () => listGudangBarangJadi() });
}

export function useGudangBarangJadiMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: GudangBarangJadiInput) => createGudangBarangJadi(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Gudang ditambahkan", toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: GudangBarangJadiInput }) =>
      updateGudangBarangJadi(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Gudang diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteGudangBarangJadi(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Gudang dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}
