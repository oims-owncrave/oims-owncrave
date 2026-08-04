"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import { listBarangMasuk, createBarangMasuk } from "@/services/barang-masuk";
import type { BarangMasukInput } from "@/lib/schemas/barang-masuk";

const KEY = ["barang-masuk"];

export function useBarangMasukList() {
  return useQuery({ queryKey: KEY, queryFn: () => listBarangMasuk() });
}

export function useBarangMasukMutation() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (input: BarangMasukInput) => createBarangMasuk(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Barang masuk dicatat", toastStyles.primary);
      // barang masuk mengubah stok + harga rata2 bahan
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["bahan"] });
      qc.invalidateQueries({ queryKey: ["stok"] });
    },
  });

  return { create };
}
