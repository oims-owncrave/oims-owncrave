"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listPenyesuaian,
  requestPenyesuaian,
  approvePenyesuaian,
  rejectPenyesuaian,
} from "@/services/penyesuaian";
import type { PenyesuaianInput } from "@/lib/schemas/penyesuaian";

export const KEY_PENYESUAIAN = ["penyesuaian"];

export function usePenyesuaianList(status?: "pending" | "approved" | "rejected") {
  return useQuery({
    queryKey: [...KEY_PENYESUAIAN, status],
    queryFn: () => listPenyesuaian(status),
  });
}

export function usePenyesuaianMutation() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY_PENYESUAIAN });
    qc.invalidateQueries({ queryKey: ["stok"] });
    qc.invalidateQueries({ queryKey: ["mutasi"] });
  };

  const request = useMutation({
    mutationFn: (input: PenyesuaianInput) => requestPenyesuaian(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Penyesuaian berhasil diajukan", toastStyles?.primary);
      invalidate();
    },
  });

  const approve = useMutation({
    mutationFn: (id: string) => approvePenyesuaian(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Penyesuaian disetujui, stok diperbarui", toastStyles?.primary);
      invalidate();
    },
  });

  const reject = useMutation({
    mutationFn: (id: string) => rejectPenyesuaian(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.warning("Penyesuaian ditolak");
      invalidate();
    },
  });

  return { request, approve, reject };
}
