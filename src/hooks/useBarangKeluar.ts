"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listBarangKeluar,
  createBarangKeluar,
  getBarangKeluarDetail,
} from "@/services/barang-keluar";
import type { BarangKeluarInput } from "@/lib/schemas/barang-keluar";

export const KEY_BARANG_KELUAR = ["barang-keluar"];

export function useBarangKeluarList() {
  return useQuery({
    queryKey: KEY_BARANG_KELUAR,
    queryFn: () => listBarangKeluar(),
  });
}

export function useBarangKeluarDetail(id: string) {
  return useQuery({
    queryKey: [...KEY_BARANG_KELUAR, id],
    queryFn: () => getBarangKeluarDetail(id),
    enabled: !!id,
  });
}

export function useBarangKeluarMutation() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY_BARANG_KELUAR });
    qc.invalidateQueries({ queryKey: ["bahan"] });
    qc.invalidateQueries({ queryKey: ["stok"] });
  };

  const create = useMutation({
    mutationFn: (input: BarangKeluarInput) => createBarangKeluar(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Barang keluar berhasil disimpan", toastStyles?.primary);
      invalidate();
    },
  });

  return { create };
}
