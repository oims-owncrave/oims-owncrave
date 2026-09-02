"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listVendor,
  createVendor,
  updateVendor,
  softDeleteVendor,
} from "@/services/vendor";
import type { VendorInput } from "@/lib/schemas/vendor";

const KEY = ["vendor"];

export function useVendorList() {
  return useQuery({ queryKey: KEY, queryFn: () => listVendor() });
}

export function useVendorMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: VendorInput) => createVendor(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Vendor ditambahkan", toastStyles?.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: VendorInput }) => updateVendor(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Vendor diperbarui", toastStyles?.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteVendor(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Vendor dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}
