"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listJenisCacat,
  createJenisCacat,
  updateJenisCacat,
  softDeleteJenisCacat,
} from "@/services/jenis-cacat";
import type { JenisCacatInput } from "@/lib/schemas/jenis-cacat";

const KEY = ["jenis-cacat"];

export function useJenisCacatList() {
  return useQuery({ queryKey: KEY, queryFn: () => listJenisCacat() });
}

export function useJenisCacatMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: JenisCacatInput) => createJenisCacat(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Jenis cacat ditambahkan", toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: JenisCacatInput }) =>
      updateJenisCacat(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Jenis cacat diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteJenisCacat(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Jenis cacat dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}
