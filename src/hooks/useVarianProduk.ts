"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  getProdukDetail,
  generateVarian,
  updateVarian,
  softDeleteVarian,
} from "@/services/varian-produk";
import type {
  VarianGenerateInput,
  VarianUpdateInput,
} from "@/lib/schemas/varian-produk";

const detailKey = (produkId: string) => ["produk", produkId];

export function useProdukDetail(produkId: string) {
  return useQuery({
    queryKey: detailKey(produkId),
    queryFn: () => getProdukDetail(produkId),
    enabled: produkId.length > 0,
  });
}

export function useVarianMutation(produkId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: detailKey(produkId) });

  const generate = useMutation({
    mutationFn: (input: VarianGenerateInput) => generateVarian(produkId, input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal membuat varian");
      const { created, skipped } = res.data;
      const skipMsg = skipped.length > 0 ? `, ${skipped.length} dilewati (sudah ada)` : "";
      if (created === 0) {
        toast.error(`Tidak ada varian baru${skipMsg}`);
      } else {
        toast.success(`${created} varian dibuat${skipMsg}`, toastStyles.primary);
      }
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: VarianUpdateInput }) =>
      updateVarian(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Varian diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteVarian(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Varian dihapus");
      invalidate();
    },
  });

  return { generate, update, remove };
}
