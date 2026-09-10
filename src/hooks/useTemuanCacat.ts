"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listTemuanByHasilQc,
  createTemuanCacat,
  deleteTemuanCacat,
} from "@/services/temuan-cacat";
import type { TemuanCacatInput } from "@/lib/schemas/temuan-cacat";

export function useTemuanCacatList(hasilQcId: string) {
  return useQuery({
    queryKey: ["temuan-cacat", hasilQcId],
    queryFn: () => listTemuanByHasilQc(hasilQcId),
  });
}

export function useTemuanCacatMutation(hasilQcId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["temuan-cacat", hasilQcId] });
    qc.invalidateQueries({ queryKey: ["hasil-qc"] });
  };

  const create = useMutation({
    mutationFn: (input: TemuanCacatInput) => createTemuanCacat(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Temuan cacat dicatat", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTemuanCacat(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Temuan cacat dihapus");
      invalidate();
    },
  });

  return { create, remove };
}
