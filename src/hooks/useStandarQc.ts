"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listStandarQc,
  createStandarQc,
  updateStandarQc,
  createVersiBaruStandarQc,
  activateStandarQc,
  deactivateStandarQc,
  softDeleteStandarQc,
} from "@/services/standar-qc";
import type { StandarQcInput } from "@/lib/schemas/standar-qc";

const KEY = ["standar-qc"];

export function useStandarQcList() {
  return useQuery({ queryKey: KEY, queryFn: () => listStandarQc() });
}

export function useStandarQcMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: StandarQcInput) => createStandarQc(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Standar ${res.data?.nomorDokumen} dibuat (v${res.data?.versi})`, toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: StandarQcInput }) => updateStandarQc(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Standar QC diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const versiBaru = useMutation({
    mutationFn: (id: string) => createVersiBaruStandarQc(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Versi baru dibuat (v${res.data?.versi}, draft)`, toastStyles.primary);
      invalidate();
    },
  });

  const activate = useMutation({
    mutationFn: (id: string) => activateStandarQc(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Standar diaktifkan — versi lama otomatis nonaktif", toastStyles.primary);
      invalidate();
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => deactivateStandarQc(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Standar dinonaktifkan", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteStandarQc(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Standar QC dihapus");
      invalidate();
    },
  });

  return { create, update, versiBaru, activate, deactivate, remove };
}
