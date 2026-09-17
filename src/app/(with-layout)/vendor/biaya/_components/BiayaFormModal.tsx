"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { formatRupiah } from "@/lib/utils";
import { biayaSchema, type BiayaInput } from "@/lib/schemas/biaya-jasa-jahit";
import { useBiayaMutation } from "@/hooks/useBiayaJasaJahit";
import type { BiayaListRow } from "@/services/biaya-jasa-jahit";

interface Props {
  item: BiayaListRow | null;
  onClose: () => void;
}

export function BiayaFormModal({ item, onClose }: Props) {
  const { update, usulan } = useBiayaMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BiayaInput>({
    resolver: zodResolver(biayaSchema),
    defaultValues: { bonus: 0, biayaTambahan: 0, potongan: 0, uangMuka: 0, catatan: "" },
  });

  useEffect(() => {
    if (item) {
      reset({
        bonus: Number(item.bonus ?? 0),
        biayaTambahan: Number(item.biayaTambahan ?? 0),
        potongan: Number(item.potongan ?? 0),
        uangMuka: Number(item.uangMuka ?? 0),
        catatan: item.catatan ?? "",
      });
    }
  }, [item, reset]);

  if (!item) return null;

  const isPending = update.isPending || usulan.isPending;
  const v = watch();
  const tagihan =
    Number(item.biayaDasar) + (v.bonus || 0) + (v.biayaTambahan || 0) - (v.potongan || 0) - (v.uangMuka || 0);
  const adaUsulan = Number(item.usulTambahan) > 0 || Number(item.usulPotongan) > 0;

  const onSubmit = async (data: BiayaInput) => {
    const res = await update.mutateAsync({ penugasanId: item.penugasanId, input: data });
    if (!res.error) onClose();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-1 text-xl font-bold text-dark dark:text-white">Tagihan {item.penugasanNomor}</h2>
        <p className="mb-4 text-sm text-dark-5 dark:text-dark-6">{item.pihakNama} · {item.poNomor}</p>

        <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-sm dark:bg-gray-800">
          <div className="flex justify-between"><span className="text-dark-5 dark:text-dark-6">Jumlah diakui (baik)</span><span className="font-medium">{item.jumlahDiakui} pcs</span></div>
          <div className="flex justify-between"><span className="text-dark-5 dark:text-dark-6">Biaya dasar (Σ baik × tarif)</span><span className="font-medium">{formatRupiah(item.biayaDasar)}</span></div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput
            decimals={0}
            placeholder="0" label="Bonus" value={watch("bonus")}
  onChange={(v) =>
    setValue("bonus", v as number, { shouldValidate: true })
  } error={errors.bonus?.message} disabled={isPending} />
            <NumberInput
            decimals={0}
            placeholder="0" label="Biaya Tambahan" value={watch("biayaTambahan")}
  onChange={(v) =>
    setValue("biayaTambahan", v as number, { shouldValidate: true })
  } error={errors.biayaTambahan?.message} disabled={isPending} />
            <NumberInput
            decimals={0}
            placeholder="0" label="Potongan" value={watch("potongan")}
  onChange={(v) =>
    setValue("potongan", v as number, { shouldValidate: true })
  } error={errors.potongan?.message} disabled={isPending} />
            <NumberInput
            decimals={0}
            placeholder="0" label="Uang Muka" value={watch("uangMuka")}
  onChange={(v) =>
    setValue("uangMuka", v as number, { shouldValidate: true })
  } error={errors.uangMuka?.message} disabled={isPending} />
          </div>

          {adaUsulan && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
              <p className="mb-1">
                Terhitung dari data: tambahan <strong>{formatRupiah(item.usulTambahan)}</strong> (perbaikan retur ditanggung Owncrave),
                potongan <strong>{formatRupiah(item.usulPotongan)}</strong> (kasus ditanggung vendor).
              </p>
              <button
                type="button"
                className="font-medium underline"
                onClick={() => {
                  setValue("biayaTambahan", Number(item.usulTambahan));
                  setValue("potongan", Number(item.usulPotongan));
                }}
              >
                Pakai angka ini
              </button>
            </div>
          )}

          <Input label="Catatan" placeholder="Opsional" {...register("catatan")} disabled={isPending} />

          <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-3 dark:bg-primary/10">
            <span className="text-sm font-medium text-dark dark:text-white">Tagihan Bersih</span>
            <span className="text-lg font-bold text-primary">{formatRupiah(tagihan)}</span>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
            <Button type="submit" loading={update.isPending}>Simpan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
