"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listPengiriman,
  getPengirimanDetail,
  listDetailBelumDikirim,
  createPengiriman,
  cancelPengiriman,
  createSerahTerima,
  listSuratJalan,
} from "@/services/pengiriman-jahit";
import type { PengirimanInput, SerahTerimaInput } from "@/lib/schemas/pengiriman-jahit";

const KEY = ["pengiriman-jahit"];

export function usePengirimanList() {
  return useQuery({ queryKey: KEY, queryFn: () => listPengiriman() });
}

export function usePengirimanDetail(id: string) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => getPengirimanDetail(id) });
}

export function useDetailBelumDikirim(penugasanId: string) {
  return useQuery({
    queryKey: [...KEY, "belum-dikirim", penugasanId],
    queryFn: () => listDetailBelumDikirim(penugasanId),
    enabled: !!penugasanId,
  });
}

export function useSuratJalanList() {
  return useQuery({ queryKey: [...KEY, "surat-jalan"], queryFn: () => listSuratJalan() });
}

export function usePengirimanMutation() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ["penugasan-jahit"] });
    qc.invalidateQueries({ queryKey: ["bundling"] });
  };

  const create = useMutation({
    mutationFn: (input: PengirimanInput) => createPengiriman(input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal membuat pengiriman");
      toast.success(`Pengiriman ${res.data.nomorDokumen} dibuat — surat jalan siap cetak`, toastStyles.primary);
      invalidate();
    },
  });

  const cancel = useMutation({
    mutationFn: ({ id, alasan }: { id: string; alasan: string }) => cancelPengiriman(id, alasan),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Pengiriman dibatalkan — bundel kembali siap dikirim");
      invalidate();
    },
  });

  const serahTerima = useMutation({
    mutationFn: ({ pengirimanId, input }: { pengirimanId: string; input: SerahTerimaInput }) =>
      createSerahTerima(pengirimanId, input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal mencatat serah terima");
      toast.success(`Serah terima ${res.data.nomorDokumen} tercatat`, toastStyles.primary);
      invalidate();
    },
  });

  return { create, cancel, serahTerima };
}
