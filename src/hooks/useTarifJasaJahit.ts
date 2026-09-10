"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listTarifJasaJahit,
  createTarifJasaJahit,
  updateTarifJasaJahit,
  createVersiBaruTarif,
  activateTarifJasaJahit,
  deactivateTarifJasaJahit,
  softDeleteTarifJasaJahit,
} from "@/services/tarif-jasa-jahit";
import type { TarifJasaJahitInput } from "@/lib/schemas/tarif-jasa-jahit";

const KEY = ["tarif-jasa-jahit"];

export function useTarifJasaJahitList() {
  return useQuery({ queryKey: KEY, queryFn: () => listTarifJasaJahit() });
}

export function useTarifJasaJahitMutation() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: TarifJasaJahitInput) => createTarifJasaJahit(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Tarif ditambahkan (draft)", toastStyles?.primary);
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TarifJasaJahitInput }) =>
      updateTarifJasaJahit(id, input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Tarif diperbarui", toastStyles?.primary);
      invalidate();
    },
  });

  // ubah harga = versi BARU, tarif lama tidak ditimpa (PRD T3 §7)
  const versiBaru = useMutation({
    mutationFn: ({ id, nominal, catatan }: { id: string; nominal: number; catatan?: string }) =>
      createVersiBaruTarif(id, nominal, catatan),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Versi baru dibuat (draft) — aktifkan untuk memberlakukan", toastStyles?.primary);
      invalidate();
    },
  });

  const activate = useMutation({
    mutationFn: (id: string) => activateTarifJasaJahit(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success("Tarif diaktifkan", toastStyles?.primary);
      invalidate();
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => deactivateTarifJasaJahit(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Tarif dinonaktifkan");
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteTarifJasaJahit(id),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.error("Tarif dihapus");
      invalidate();
    },
  });

  return { create, update, versiBaru, activate, deactivate, remove };
}
