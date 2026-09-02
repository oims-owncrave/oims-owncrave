"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { keputusanSchema, type KeputusanInput, KEPUTUSAN, KEPUTUSAN_LABEL, KLASIFIKASI_LABEL } from "@/lib/schemas/selisih-jahit";
import { useSelisihMutation } from "@/hooks/useSelisihJahit";
import type { SelisihListRow } from "@/services/selisih-jahit";

interface Props {
  item: SelisihListRow | null;
  onClose: () => void;
}

/** Keputusan owner — setelah ini hilang/rusak mengurangi sisa WIP (pola approval penyesuaian stok). */
export function KeputusanModal({ item, onClose }: Props) {
  const { putuskan } = useSelisihMutation();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<KeputusanInput>({ resolver: zodResolver(keputusanSchema), defaultValues: { keputusan: "ditanggung_vendor", catatan: "" } });

  useEffect(() => {
    if (item) reset({ keputusan: item.klasifikasi === "rusak" ? "diperbaiki" : "ditanggung_vendor", catatan: "" });
  }, [item, reset]);

  if (!item) return null;
  const keputusan = watch("keputusan");
  const isPending = putuskan.isPending;
  const kurangiWip =
    (item.klasifikasi === "hilang" && keputusan !== "ditemukan") ||
    (item.klasifikasi === "rusak" && ["ditanggung_vendor", "ditanggung_owncrave", "dihapusbukukan"].includes(keputusan));

  const onSubmit = async (data: KeputusanInput) => {
    const res = await putuskan.mutateAsync({ id: item.id, input: data });
    if (!res.error) onClose();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-1 text-xl font-bold text-dark dark:text-white">Putuskan {item.nomorKasus}</h2>
        <p className="mb-4 text-sm text-dark-5 dark:text-dark-6">
          {KLASIFIKASI_LABEL[item.klasifikasi]} · {item.jumlah} pcs · {item.bundelNomor} · {item.pihakNama}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Keputusan" options={KEPUTUSAN.map((k) => ({ value: k, label: KEPUTUSAN_LABEL[k] }))} {...register("keputusan")} error={errors.keputusan?.message} disabled={isPending} />
          <Input label="Catatan keputusan" placeholder="Opsional" {...register("catatan")} disabled={isPending} />

          <p className={`rounded-lg px-3 py-2 text-xs ${kurangiWip ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300" : "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
            {kurangiWip
              ? `Sisa WIP bundel berkurang ${item.jumlah} pcs — penugasan bisa jadi selesai. Tidak bisa dibatalkan.`
              : "Tidak mengubah sisa WIP (barang dianggap masih ada / akan kembali lewat retur)."}
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
            <Button type="submit" loading={isPending}>Putuskan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
