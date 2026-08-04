"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listSupplier,
  createSupplier,
  updateSupplier,
  softDeleteSupplier,
} from "@/services/supplier";
import type { SupplierInput } from "@/lib/schemas/supplier";

const KEY = ["supplier"];

export function useSupplierList() {
  return useQuery({ queryKey: KEY, queryFn: () => listSupplier() });
}

export function useSupplierMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: SupplierInput) => createSupplier(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Supplier ditambahkan", toastStyles?.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SupplierInput }) =>
      updateSupplier(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Supplier diperbarui", toastStyles?.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteSupplier(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Supplier dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}
