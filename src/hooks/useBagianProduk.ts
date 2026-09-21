"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listBagianProduk,
  createBagianProduk,
  updateBagianProduk,
  softDeleteBagianProduk,
} from "@/services/bagian-produk";
import type { BagianProdukInput } from "@/lib/schemas/bagian-produk";

const KEY = ["bagian-produk"];

export function useBagianProdukList() {
  return useQuery({ queryKey: KEY, queryFn: () => listBagianProduk() });
}

export function useBagianProdukMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: BagianProdukInput) => createBagianProduk(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Bagian produk ditambahkan", toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: BagianProdukInput }) =>
      updateBagianProduk(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Bagian produk diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteBagianProduk(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Bagian produk dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}
