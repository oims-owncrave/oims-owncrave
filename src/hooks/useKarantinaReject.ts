"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listRejectBelumDikarantina,
  listKarantinaReject,
  getKarantinaRejectDetail,
  createKarantinaReject,
  createTindakanReject,
  approveTindakanReject,
} from "@/services/karantina-reject";
import type {
  KarantinaRejectInput,
  TindakanRejectInput,
} from "@/lib/schemas/karantina-reject";

const BELUM = ["reject-belum-karantina"];
const LIST = ["karantina-reject"];

export function useRejectBelumKarantina() {
  return useQuery({ queryKey: BELUM, queryFn: () => listRejectBelumDikarantina() });
}

export function useKarantinaRejectList() {
  return useQuery({ queryKey: LIST, queryFn: () => listKarantinaReject() });
}

export function useKarantinaRejectDetail(id: string | null) {
  return useQuery({
    queryKey: ["karantina-reject-detail", id],
    queryFn: () => getKarantinaRejectDetail(id as string),
    enabled: !!id,
  });
}

export function useKarantinaRejectMutation(detailId?: string | null) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: BELUM });
    qc.invalidateQueries({ queryKey: LIST });
    if (detailId) {
      qc.invalidateQueries({ queryKey: ["karantina-reject-detail", detailId] });
    }
  };

  const create = useMutation({
    mutationFn: (input: KarantinaRejectInput) => createKarantinaReject(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`Karantina ${res.data?.nomorDokumen} dibuat`, toastStyles.primary);
      invalidate();
    },
  });

  const buatTindakan = useMutation({
    mutationFn: (input: TindakanRejectInput) => createTindakanReject(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Tindakan diajukan — menunggu persetujuan owner", toastStyles.primary);
      invalidate();
    },
  });

  const approve = useMutation({
    mutationFn: ({ id, setuju }: { id: string; setuju: boolean }) =>
      approveTindakanReject(id, setuju),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      if (res.data?.status === "approved") {
        toast.success("Tindakan disetujui", toastStyles.primary);
      } else {
        toast.error("Tindakan ditolak");
      }
      invalidate();
    },
  });

  return { create, buatTindakan, approve };
}
