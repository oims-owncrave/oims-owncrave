"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listKontakVendor,
  listKontakByVendor,
  createKontakVendor,
  updateKontakVendor,
  softDeleteKontakVendor,
} from "@/services/kontak-vendor";
import type { KontakVendorInput } from "@/lib/schemas/kontak-vendor";

const KEY = ["kontak-vendor"];

export function useKontakVendorList() {
  return useQuery({ queryKey: KEY, queryFn: () => listKontakVendor() });
}

export function useKontakByVendor(vendorId: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "by-vendor", vendorId],
    queryFn: () => listKontakByVendor(vendorId!),
    enabled: !!vendorId,
  });
}

export function useKontakVendorMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: KontakVendorInput) => createKontakVendor(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Kontak vendor ditambahkan", toastStyles?.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: KontakVendorInput }) =>
      updateKontakVendor(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Kontak vendor diperbarui", toastStyles?.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteKontakVendor(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Kontak vendor dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}
