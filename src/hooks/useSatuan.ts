"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listSatuan,
  createSatuan,
  updateSatuan,
  softDeleteSatuan,
} from "@/services/satuan";
import type { SatuanInput } from "@/lib/schemas/satuan";

const KEY = ["satuan"];

export function useSatuanList() {
  return useQuery({ queryKey: KEY, queryFn: () => listSatuan() });
}

export function useSatuanMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: SatuanInput) => createSatuan(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Satuan ditambahkan", toastStyles?.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SatuanInput }) =>
      updateSatuan(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Satuan diperbarui", toastStyles?.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteSatuan(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Satuan dihapus"); // Red color for delete as per convention
      invalidate();
    },
  });

  return { create, update, remove };
}
