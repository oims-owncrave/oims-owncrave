"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listLokasiProduksi,
  createLokasiProduksi,
  updateLokasiProduksi,
  softDeleteLokasiProduksi,
} from "@/services/lokasi-produksi";
import type { LokasiProduksiInput } from "@/lib/schemas/lokasi-produksi";

const KEY = ["lokasi-produksi"];

export function useLokasiProduksiList() {
  return useQuery({ queryKey: KEY, queryFn: () => listLokasiProduksi() });
}

export function useLokasiProduksiMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: LokasiProduksiInput) => createLokasiProduksi(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Lokasi ditambahkan", toastStyles?.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: LokasiProduksiInput }) =>
      updateLokasiProduksi(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Lokasi diperbarui", toastStyles?.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteLokasiProduksi(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Lokasi dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}
