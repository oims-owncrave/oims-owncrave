"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listPo,
  getPoDetail,
  getEstimasiBahan,
  createPo,
  updatePo,
  submitPo,
  approvePo,
  cancelPo,
  softDeletePo,
} from "@/services/po-produksi";
import type { PoInput } from "@/lib/schemas/po-produksi";

const KEY = ["po-produksi"];

export function usePoList() {
  return useQuery({ queryKey: KEY, queryFn: () => listPo() });
}

export function usePoDetail(id: string) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => getPoDetail(id) });
}

export function useEstimasiBahan(poId: string) {
  return useQuery({
    queryKey: [...KEY, poId, "estimasi"],
    queryFn: () => getEstimasiBahan(poId),
  });
}

export function usePoMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: PoInput) => createPo(input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal membuat PO");
      toast.success(`PO ${res.data.nomorDokumen} dibuat (draft)`, toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PoInput }) => updatePo(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("PO diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const submit = useMutation({
    mutationFn: (id: string) => submitPo(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("PO diajukan untuk persetujuan", toastStyles.primary);
      invalidate();
    },
  });

  const approve = useMutation({
    mutationFn: (id: string) => approvePo(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("PO disetujui — BOM aktif dikunci ke PO", toastStyles.primary);
      invalidate();
    },
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelPo(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("PO dibatalkan");
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeletePo(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("PO dihapus");
      invalidate();
    },
  });

  return { create, update, submit, approve, cancel, remove };
}
