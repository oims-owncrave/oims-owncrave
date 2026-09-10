"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listTransferFg,
  listPenyesuaianFg,
  listStokUntukTransfer,
  createTransferFg,
  updateStatusTransferFg,
  createPenyesuaianFg,
  approvePenyesuaianFg,
} from "@/services/transfer-fg";
import type { TransferFgInput, PenyesuaianFgInput } from "@/lib/schemas/transfer-fg";

const TRF = ["transfer-fg"];
const PS = ["penyesuaian-fg"];

export function useTransferFgList() {
  return useQuery({ queryKey: TRF, queryFn: () => listTransferFg() });
}

export function usePenyesuaianFgList() {
  return useQuery({ queryKey: PS, queryFn: () => listPenyesuaianFg() });
}

export function useStokUntukTransfer(gudangId: string | null) {
  return useQuery({
    queryKey: ["stok-untuk-transfer", gudangId],
    queryFn: () => listStokUntukTransfer(gudangId as string),
    enabled: !!gudangId,
  });
}

export function useTransferFgMutation() {
  const qc = useQueryClient();
  const invalidate = () => {
    [TRF, PS, ["stok-barang-jadi"], ["mutasi-barang-jadi"]].forEach((key) =>
      qc.invalidateQueries({ queryKey: key }),
    );
    qc.invalidateQueries({ queryKey: ["stok-untuk-transfer"] });
  };

  const create = useMutation({
    mutationFn: (input: TransferFgInput) => createTransferFg(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Transfer ${res.data?.nomorDokumen} dibuat`, toastStyles.primary);
      invalidate();
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "dikirim" | "diterima" | "dibatalkan" }) =>
      updateStatusTransferFg(id, status),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Transfer jadi ${res.data?.status}`, toastStyles.primary);
      invalidate();
    },
  });

  const buatPenyesuaian = useMutation({
    mutationFn: (input: PenyesuaianFgInput) => createPenyesuaianFg(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Penyesuaian diajukan — menunggu persetujuan owner", toastStyles.primary);
      invalidate();
    },
  });

  const approve = useMutation({
    mutationFn: ({ id, setuju }: { id: string; setuju: boolean }) =>
      approvePenyesuaianFg(id, setuju),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      if (res.data?.status === "approved") {
        toast.success("Penyesuaian disetujui — stok diperbarui", toastStyles.primary);
      } else {
        toast.error("Penyesuaian ditolak");
      }
      invalidate();
    },
  });

  return { create, setStatus, buatPenyesuaian, approve };
}
