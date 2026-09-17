"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { useTarifJasaJahitMutation } from "@/hooks/useTarifJasaJahit";
import type { TarifRow } from "./TarifTable";

interface Props {
  item: TarifRow | null;
  onClose: () => void;
}

/**
 * Ubah harga tarif = buat versi BARU (draft), tarif lama tetap utuh (PRD T3 §7).
 * Versi baru harus diaktifkan supaya menggantikan yang lama.
 */
export function VersiBaruModal({ item, onClose }: Props) {
  const { versiBaru } = useTarifJasaJahitMutation();
  const [nominal, setNominal] = useState("");
  const [catatan, setCatatan] = useState("");

  useEffect(() => {
    if (item) {
      setNominal(item.nominal);
      setCatatan("");
    }
  }, [item]);

  if (!item) return null;

  const isPending = versiBaru.isPending;

  const submit = async () => {
    const res = await versiBaru.mutateAsync({
      id: item.id,
      nominal: Number(nominal),
      catatan: catatan || undefined,
    });
    if (!res.error) onClose();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-1 text-xl font-bold text-dark dark:text-white">Buat Versi Baru</h2>
        <p className="mb-4 text-sm text-dark-5 dark:text-dark-6">
          {item.produkNama} · {item.vendorNama || item.penjahitNama} · versi aktif v{item.versi}
        </p>

        <div className="space-y-4">
          <NumberInput
            label="Nominal Baru"
            placeholder="0"
            value={nominal}
            onChange={(v) => setNominal(v === undefined ? "" : String(v))}
            disabled={isPending}
          />
          <Input
            label="Catatan (alasan perubahan)"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            disabled={isPending}
          />
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            Versi baru dibuat sebagai <strong>draft</strong>. Aktifkan untuk memberlakukannya —
            versi lama otomatis jadi nonaktif. Penugasan lama tetap pakai nominal lamanya.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
          <Button onClick={submit} loading={isPending}>
            {isPending ? "Menyimpan..." : "Buat Versi Baru"}
          </Button>
        </div>
      </div>
    </div>
  );
}
