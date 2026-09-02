"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listProduk,
  createProduk,
  updateProduk,
  softDeleteProduk,
} from "@/services/produk";
import type { ProdukInput } from "@/lib/schemas/produk";

const KEY = ["produk"];

export function useProdukList() {
  return useQuery({ queryKey: KEY, queryFn: () => listProduk() });
}

export function useProdukMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: ProdukInput) => createProduk(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Produk ditambahkan", toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProdukInput }) =>
      updateProduk(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Produk diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteProduk(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Produk dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}
