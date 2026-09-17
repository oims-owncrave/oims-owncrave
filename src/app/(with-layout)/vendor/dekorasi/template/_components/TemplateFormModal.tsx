"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  templateSchema,
  type TemplateInput,
  DEKORASI_JENIS,
  DEKORASI_JENIS_LABEL,
  DEKORASI_POSISI,
  DEKORASI_POSISI_LABEL,
} from "@/lib/schemas/dekorasi";
import { useTemplateMutation } from "@/hooks/useDekorasi";
import type { TemplateListRow } from "@/services/dekorasi";
import type { Produk } from "@/db/schema";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: TemplateListRow | null;
  produkList: Produk[];
}

const EMPTY: TemplateInput = {
  produkId: "",
  jenis: "sablon",
  posisi: "dada_kiri",
  deskripsi: "",
  tarifDefault: undefined as unknown as number,
  isActive: true,
};

export function TemplateFormModal({ open, onClose, initialData, produkList }: Props) {
  const { create, update } = useTemplateMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TemplateInput>({ resolver: zodResolver(templateSchema), defaultValues: EMPTY });

  const isActive = watch("isActive");

  useEffect(() => {
    if (!open) return;
    reset(
      initialData
        ? {
            produkId: initialData.produkId,
            jenis: initialData.jenis,
            posisi: initialData.posisi,
            deskripsi: initialData.deskripsi ?? "",
            tarifDefault: Number(initialData.tarifDefault),
            isActive: initialData.isActive,
          }
        : EMPTY,
    );
  }, [open, initialData, reset]);

  const onSubmit = async (data: TemplateInput) => {
    const res = isEditing ? await update.mutateAsync({ id: initialData.id, input: data }) : await create.mutateAsync(data);
    if (!res.error) onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative w-full max-w-lg rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">{isEditing ? "Edit Template" : "Tambah Template Dekorasi"}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Produk"
            options={[{ value: "", label: "— Pilih produk —" }, ...produkList.filter((p) => p.isActive).map((p) => ({ value: p.id, label: `${p.kode} — ${p.nama}` }))]}
            {...register("produkId")}
            error={errors.produkId?.message}
            disabled={isPending}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Jenis" options={DEKORASI_JENIS.map((j) => ({ value: j, label: DEKORASI_JENIS_LABEL[j] }))} {...register("jenis")} disabled={isPending} />
            <Select label="Posisi" options={DEKORASI_POSISI.map((p) => ({ value: p, label: DEKORASI_POSISI_LABEL[p] }))} {...register("posisi")} disabled={isPending} />
          </div>
          <Input label="Deskripsi" placeholder="Misal: logo 8cm, 2 warna" {...register("deskripsi")} disabled={isPending} />
          <NumberInput
            decimals={0}
            placeholder="0" label="Tarif Default per Pcs (Rp)" value={watch("tarifDefault")}
  onChange={(v) =>
    setValue("tarifDefault", v as number, { shouldValidate: true })
  } error={errors.tarifDefault?.message} disabled={isPending} />

          <div className="py-2">
            <Checkbox checked={isActive} onChange={(c) => setValue("isActive", c)} disabled={isPending} label="Status Aktif" />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
            <Button type="submit" loading={isPending}>Simpan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
