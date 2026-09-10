"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastStyles } from "@/lib/utils";
import {
  listPackingSiapMasukGudang,
  listBarangJadi,
  listStokBarangJadi,
  listMutasiBarangJadi,
  terimaBarangJadi,
} from "@/services/barang-jadi";
import type { BarangJadiInput } from "@/lib/schemas/packing";

const SIAP = ["packing-siap-gudang"];
const FG = ["barang-jadi"];
const STOK = ["stok-barang-jadi"];
const MUTASI = ["mutasi-barang-jadi"];

export function usePackingSiapGudang() {
  return useQuery({ queryKey: SIAP, queryFn: () => listPackingSiapMasukGudang() });
}

export function useBarangJadiList() {
  return useQuery({ queryKey: FG, queryFn: () => listBarangJadi() });
}

export function useStokBarangJadi() {
  return useQuery({ queryKey: STOK, queryFn: () => listStokBarangJadi() });
}

export function useMutasiBarangJadi() {
  return useQuery({ queryKey: MUTASI, queryFn: () => listMutasiBarangJadi() });
}

export function useBarangJadiMutation() {
  const qc = useQueryClient();
  const invalidate = () => {
    [SIAP, FG, STOK, MUTASI].forEach((key) => qc.invalidateQueries({ queryKey: key }));
  };

  const terima = useMutation({
    mutationFn: (input: BarangJadiInput) => terimaBarangJadi(input),
    onSuccess: (res) => {
      if (res.error) return toast.error(res.error);
      toast.success(`${res.data?.nomorDokumen} — stok barang jadi bertambah`, toastStyles.primary);
      invalidate();
    },
  });

  return { terima };
}
