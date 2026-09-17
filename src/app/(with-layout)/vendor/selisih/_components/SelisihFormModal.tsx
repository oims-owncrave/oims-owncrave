"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ComboSelect } from "@/components/ui/ComboSelect";
import {
  selisihSchema,
  type SelisihInput,
  KLASIFIKASI,
  KLASIFIKASI_LABEL,
  RUSAK_TINGKAT,
  RUSAK_TINGKAT_LABEL,
  RUSAK_PENYEBAB,
  RUSAK_PENYEBAB_LABEL,
} from "@/lib/schemas/selisih-jahit";
import { useSelisihMutation, useDetailUntukSelisih } from "@/hooks/useSelisihJahit";
import type { SelisihListRow } from "@/services/selisih-jahit";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: SelisihListRow | null;
}

const EMPTY: SelisihInput = {
  penugasanDetailId: "",
  penerimaanId: null,
  klasifikasi: "hilang",
  jumlah: 1,
  nilaiPerPcs: 0,
  kronologi: "",
  penanggungJawab: "",
  buktiUrl: "",
  tingkatRusak: null,
  penyebabRusak: null,
  catatan: "",
};

export function SelisihFormModal({ open, onClose, initialData }: Props) {
  const { create, update } = useSelisihMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;
  const { data: detailOpsi = [] } = useDetailUntukSelisih(open);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SelisihInput>({ resolver: zodResolver(selisihSchema), defaultValues: EMPTY });

  const klasifikasi = watch("klasifikasi");
  const penugasanDetailId = watch("penugasanDetailId");

  useEffect(() => {
    if (!open) return;
    reset(
      initialData
        ? {
            penugasanDetailId: initialData.penugasanDetailId,
            penerimaanId: initialData.penerimaanId,
            klasifikasi: initialData.klasifikasi,
            jumlah: initialData.jumlah,
            nilaiPerPcs: Number(initialData.nilaiPerPcs),
            kronologi: initialData.kronologi ?? "",
            penanggungJawab: initialData.penanggungJawab ?? "",
            buktiUrl: initialData.buktiUrl ?? "",
            tingkatRusak: initialData.tingkatRusak,
            penyebabRusak: initialData.penyebabRusak,
            catatan: initialData.catatan ?? "",
          }
        : EMPTY,
    );
  }, [open, initialData, reset]);

  const onSubmit = async (data: SelisihInput) => {
    const res = isEditing ? await update.mutateAsync({ id: initialData.id, input: data }) : await create.mutateAsync(data);
    if (!res.error) onClose();
  };

  if (!open) return null;
  const nullable = (v: string) => (v === "" ? null : v);
  const autoRusak = !!initialData?.penerimaanId && initialData.klasifikasi === "rusak";

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">{isEditing ? `Edit ${initialData.nomorKasus}` : "Buka Kasus Selisih"}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ComboSelect
            label="Bundel (penugasan)"
            required
            searchable
            placeholder="Cari bundel / penugasan"
            options={detailOpsi.map((d) => ({ label: `${d.bundelNomor} · ${d.sku} — ${d.penugasanNomor} (${d.pihakNama}, ${d.jumlahPcs} pcs)`, value: d.id }))}
            value={penugasanDetailId || null}
            onChange={(v) => setValue("penugasanDetailId", (v as string) ?? "", { shouldValidate: true })}
            error={errors.penugasanDetailId}
            disabled={isEditing}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Klasifikasi"
              options={KLASIFIKASI.map((k) => ({ value: k, label: KLASIFIKASI_LABEL[k] }))}
              {...register("klasifikasi")}
              disabled={isPending || autoRusak}
            />
            <NumberInput
            decimals={0}
            placeholder="0" label="Jumlah (pcs)" required value={watch("jumlah")}
  onChange={(v) =>
    setValue("jumlah", v as number, { shouldValidate: true })
  } error={errors.jumlah?.message} disabled={isPending || autoRusak} />
            <NumberInput
            decimals={0}
            placeholder="0" label="Nilai per Pcs (Rp)" value={watch("nilaiPerPcs")}
  onChange={(v) =>
    setValue("nilaiPerPcs", v as number, { shouldValidate: true })
  } error={errors.nilaiPerPcs?.message} disabled={isPending} />
          </div>

          {klasifikasi === "rusak" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Tingkat Kerusakan" options={[{ value: "", label: "—" }, ...RUSAK_TINGKAT.map((t) => ({ value: t, label: RUSAK_TINGKAT_LABEL[t] }))]} {...register("tingkatRusak", { setValueAs: nullable })} disabled={isPending} />
              <Select label="Penyebab" options={[{ value: "", label: "—" }, ...RUSAK_PENYEBAB.map((p) => ({ value: p, label: RUSAK_PENYEBAB_LABEL[p] }))]} {...register("penyebabRusak", { setValueAs: nullable })} disabled={isPending} />
            </div>
          )}

          {klasifikasi === "hilang" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Kronologi" placeholder="Apa yang terjadi" {...register("kronologi")} disabled={isPending} />
              <Input label="Penanggung Jawab" placeholder="Nama" {...register("penanggungJawab")} disabled={isPending} />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="URL Bukti" placeholder="Opsional" {...register("buktiUrl")} disabled={isPending} />
            <Input label="Catatan" placeholder="Opsional" {...register("catatan")} disabled={isPending} />
          </div>

          <p className="text-xs text-dark-5 dark:text-dark-6">
            Nilai per pcs diisi manual sementara — nilai WIP berkomponen menyusul (backlog).
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
            <Button type="submit" loading={isPending}>{isPending ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
