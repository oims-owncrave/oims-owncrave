"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listTemplate,
  createTemplate,
  updateTemplate,
  softDeleteTemplate,
  listPekerjaanDekorasi,
  getPekerjaanDekorasiDetail,
  listTemplateProduk,
  createPekerjaanDekorasi,
  kirimPekerjaanDekorasi,
  batalPekerjaanDekorasi,
  terimaDekorasi,
} from "@/services/dekorasi";
import type { TemplateInput, PekerjaanDekorasiInput, PenerimaanDekorasiInput } from "@/lib/schemas/dekorasi";

const KEY = ["dekorasi"];

export function useTemplateList() {
  return useQuery({ queryKey: [...KEY, "template"], queryFn: () => listTemplate() });
}

export function useTemplateProduk(produkId: string) {
  return useQuery({
    queryKey: [...KEY, "template", produkId],
    queryFn: () => listTemplateProduk(produkId),
    enabled: !!produkId,
  });
}

export function usePekerjaanDekorasiList() {
  return useQuery({ queryKey: [...KEY, "pekerjaan"], queryFn: () => listPekerjaanDekorasi() });
}

export function usePekerjaanDekorasiDetail(id: string) {
  return useQuery({ queryKey: [...KEY, "pekerjaan", id], queryFn: () => getPekerjaanDekorasiDetail(id) });
}

export function useTemplateMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: TemplateInput) => createTemplate(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Template dekorasi ditambahkan", toastStyles.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TemplateInput }) => updateTemplate(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Template diperbarui", toastStyles.primary);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteTemplate(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Template dihapus");
      invalidate();
    },
  });

  return { create, update, remove };
}

export function usePekerjaanDekorasiMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: PekerjaanDekorasiInput) => createPekerjaanDekorasi(input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal membuat pekerjaan");
      toast.success(`Pekerjaan ${res.data.nomorDokumen} dibuat (draft)`, toastStyles.primary);
      invalidate();
    },
  });

  const kirim = useMutation({
    mutationFn: (id: string) => kirimPekerjaanDekorasi(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Dikirim ke vendor — surat jalan siap cetak", toastStyles.primary);
      invalidate();
    },
  });

  const batal = useMutation({
    mutationFn: (id: string) => batalPekerjaanDekorasi(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Pekerjaan dibatalkan");
      invalidate();
    },
  });

  const terima = useMutation({
    mutationFn: ({ pekerjaanId, input }: { pekerjaanId: string; input: PenerimaanDekorasiInput }) =>
      terimaDekorasi(pekerjaanId, input),
    onSuccess: (res) => {
      if (res.error || !res.data) return toast.error(res.error ?? "Gagal mencatat penerimaan");
      toast.success(`Penerimaan ${res.data.nomorDokumen} tercatat`, toastStyles.primary);
      invalidate();
    },
  });

  return { create, kirim, batal, terima };
}
