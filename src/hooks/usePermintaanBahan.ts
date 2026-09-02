"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listPermintaan,
  getPermintaanDetail,
  createPermintaan,
  updatePermintaan,
  submitPermintaan,
  approvePermintaan,
  rejectPermintaan,
  softDeletePermintaan,
} from "@/services/permintaan-bahan";
import type { PbInput } from "@/lib/schemas/permintaan-bahan";

const KEY = ["permintaan-bahan"];

export function usePermintaanList() {
  return useQuery({ queryKey: KEY, queryFn: () => listPermintaan() });
}

export function usePermintaanDetail(id: string) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => getPermintaanDetail(id) });
}

export function usePermintaanMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: PbInput) => createPermintaan(input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal membuat permintaan");
      toast.success(`Permintaan ${res.data.nomorDokumen} dibuat (draft)`, toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PbInput }) => updatePermintaan(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Permintaan diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const submit = useMutation({
    mutationFn: (id: string) => submitPermintaan(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Permintaan diajukan ke gudang", toastStyles.primary);
      invalidate();
    },
  });

  const approve = useMutation({
    mutationFn: (id: string) => approvePermintaan(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Permintaan disetujui — siap dikeluarkan via Barang Keluar", toastStyles.primary);
      invalidate();
    },
  });

  const reject = useMutation({
    mutationFn: (id: string) => rejectPermintaan(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Permintaan ditolak");
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeletePermintaan(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Permintaan dihapus");
      invalidate();
    },
  });

  return { create, update, submit, approve, reject, remove };
}
