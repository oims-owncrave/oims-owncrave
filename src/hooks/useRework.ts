"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listBarisSiapRework,
  listPerbaikanInternal,
  listReturQcVendor,
  createPerbaikanInternal,
  createReturQcVendor,
  updateStatusPerbaikanInternal,
  updateStatusReturQcVendor,
} from "@/services/rework";
import type { PerbaikanInternalInput, ReturQcVendorInput } from "@/lib/schemas/rework";

const SIAP = ["baris-siap-rework"];
const RWK = ["perbaikan-internal"];
const RTN = ["retur-qc-vendor"];

export function useBarisSiapRework() {
  return useQuery({ queryKey: SIAP, queryFn: () => listBarisSiapRework() });
}

export function usePerbaikanInternalList() {
  return useQuery({ queryKey: RWK, queryFn: () => listPerbaikanInternal() });
}

export function useReturQcVendorList() {
  return useQuery({ queryKey: RTN, queryFn: () => listReturQcVendor() });
}

export function useReworkMutation() {
  const qc = useQueryClient();
  // dua jalur berbagi kapasitas — invalidate keduanya + kandidat + sumber Re-QC
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: SIAP });
    qc.invalidateQueries({ queryKey: RWK });
    qc.invalidateQueries({ queryKey: RTN });
    qc.invalidateQueries({ queryKey: ["sumber-re-qc"] });
  };

  const createInternal = useMutation({
    mutationFn: (input: PerbaikanInternalInput) => createPerbaikanInternal(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Perbaikan ${res.data?.nomorDokumen} dibuat`, toastStyles.primary);
      invalidate();
    },
  });

  const createRetur = useMutation({
    mutationFn: (input: ReturQcVendorInput) => createReturQcVendor(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Retur ${res.data?.nomorDokumen} dibuat`, toastStyles.primary);
      invalidate();
    },
  });

  const setStatusInternal = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "dikerjakan" | "selesai" | "dibatalkan" }) =>
      updateStatusPerbaikanInternal(id, status),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Status jadi ${res.data?.status}`, toastStyles.primary);
      invalidate();
    },
  });

  const setStatusRetur = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "dikirim" | "diterima_kembali" | "selesai" | "dibatalkan";
    }) => updateStatusReturQcVendor(id, status),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Status jadi ${res.data?.status}`, toastStyles.primary);
      invalidate();
    },
  });

  return { createInternal, createRetur, setStatusInternal, setStatusRetur };
}
