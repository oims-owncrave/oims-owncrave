"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listRetur,
  getReturDetail,
  listRusakBisaDiretur,
  createRetur,
  updateRetur,
  setReturStatus,
  softDeleteRetur,
} from "@/services/retur-jahit";
import type { ReturInput } from "@/lib/schemas/retur-jahit";

const KEY = ["retur-jahit"];

export function useReturList() {
  return useQuery({ queryKey: KEY, queryFn: () => listRetur() });
}

export function useReturDetail(id: string) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => getReturDetail(id) });
}

export function useRusakBisaDiretur(penerimaanId: string) {
  return useQuery({
    queryKey: [...KEY, "rusak", penerimaanId],
    queryFn: () => listRusakBisaDiretur(penerimaanId),
    enabled: !!penerimaanId,
  });
}

export function useReturMutation() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ["penugasan-jahit"] });
    qc.invalidateQueries({ queryKey: ["penerimaan-hasil-jahit"] });
  };

  const create = useMutation({
    mutationFn: (input: ReturInput) => createRetur(input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal membuat retur");
      toast.success(`Retur ${res.data.nomorDokumen} dibuat (draft)`, toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReturInput }) => updateRetur(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Retur diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => setReturStatus(id, status),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Status retur diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteRetur(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Retur dihapus");
      invalidate();
    },
  });

  return { create, update, setStatus, remove };
}
