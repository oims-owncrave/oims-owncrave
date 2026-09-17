"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  serahTerimaSchema,
  type SerahTerimaInput,
  KONDISI_BUNDEL,
  KONDISI_BUNDEL_LABEL,
} from "@/lib/schemas/pengiriman-jahit";
import { usePengirimanMutation } from "@/hooks/usePengirimanJahit";
import type { PengirimanDetailData } from "@/services/pengiriman-jahit";
import type { LokasiRow } from "../../../lokasi/_components/LokasiTable";

interface Props {
  open: boolean;
  onClose: () => void;
  pengiriman: PengirimanDetailData;
  lokasiList: LokasiRow[];
}

const nowLocalISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

/** Serah terima bundel di vendor (PRD §12) — kondisi per bundel, sekali per pengiriman. */
export function SerahTerimaModal({ open, onClose, pengiriman, lokasiList }: Props) {
  const { serahTerima } = usePengirimanMutation();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SerahTerimaInput>({
    resolver: zodResolver(serahTerimaSchema),
    defaultValues: { tanggalJam: nowLocalISO(), penerima: "", lokasiId: null, fotoUrl: "", catatan: "", details: [] },
  });
  const { fields } = useFieldArray({ control, name: "details" });
  const details = watch("details");

  useEffect(() => {
    if (!open) return;
    reset({
      tanggalJam: nowLocalISO(),
      penerima: pengiriman.penerima ?? "",
      lokasiId: pengiriman.lokasiTujuanId,
      fotoUrl: "",
      catatan: "",
      details: pengiriman.details.map((d) => ({
        pengirimanDetailId: d.id,
        jumlahDiterima: d.jumlahPcs,
        kondisi: "lengkap" as const,
        catatan: "",
      })),
    });
  }, [open, pengiriman, reset]);

  const onSubmit = async (data: SerahTerimaInput) => {
    const res = await serahTerima.mutateAsync({ pengirimanId: pengiriman.id, input: data });
    if (!res.error) onClose();
  };

  if (!open) return null;
  const isPending = serahTerima.isPending;
  const nullable = (v: string) => (v === "" ? null : v);

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-1 text-xl font-bold text-dark dark:text-white">Catat Serah Terima</h2>
        <p className="mb-4 text-sm text-dark-5 dark:text-dark-6">{pengiriman.nomorDokumen} → {pengiriman.pihakNama}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="datetime-local" label="Tanggal & Jam Terima" required {...register("tanggalJam")} error={errors.tanggalJam?.message} />
            <Input label="Nama Penerima" required placeholder="Siapa yang menerima di vendor" {...register("penerima")} error={errors.penerima?.message} />
            <Select
              label="Lokasi Terima"
              options={[
                { value: "", label: "— Pilih lokasi —" },
                ...lokasiList.filter((l) => l.isActive).map((l) => ({ value: l.id, label: `${l.kode} — ${l.nama}` })),
              ]}
              {...register("lokasiId", { setValueAs: nullable })}
            />
            <Input label="URL Foto / Tanda Tangan" placeholder="Opsional" {...register("fotoUrl")} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke text-left text-xs uppercase text-dark-5 dark:border-dark-3 dark:text-dark-6">
                  <th className="py-2 pr-3">Bundel</th>
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3 text-right">Dikirim</th>
                  <th className="py-2 pr-3">Diterima</th>
                  <th className="py-2 pr-3">Kondisi</th>
                  <th className="py-2">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f, i) => {
                  const src = pengiriman.details.find((d) => d.id === details[i]?.pengirimanDetailId);
                  return (
                    <tr key={f.id} className="border-b border-stroke/60 dark:border-dark-3/60">
                      <td className="py-2 pr-3 font-medium text-dark dark:text-white">{src?.bundelNomor}</td>
                      <td className="py-2 pr-3">{src?.sku}</td>
                      <td className="py-2 pr-3 text-right">{src?.jumlahPcs}</td>
                      <td className="py-2 pr-3">
                        <NumberInput
            decimals={0}
            placeholder="0" className="w-24" value={watch(`details.${i}.jumlahDiterima`)}
  onChange={(v) =>
    setValue(`details.${i}.jumlahDiterima`, v as number, { shouldValidate: true })
  } error={errors.details?.[i]?.jumlahDiterima?.message} />
                      </td>
                      <td className="py-2 pr-3">
                        <Select className="w-40" options={KONDISI_BUNDEL.map((k) => ({ value: k, label: KONDISI_BUNDEL_LABEL[k] }))} {...register(`details.${i}.kondisi`)} />
                      </td>
                      <td className="py-2">
                        <Input className="w-40" placeholder="Opsional" {...register(`details.${i}.catatan`)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Input label="Catatan Umum" placeholder="Opsional" {...register("catatan")} />

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
            <Button type="submit" loading={isPending}>{isPending ? "Menyimpan..." : "Simpan Serah Terima"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
