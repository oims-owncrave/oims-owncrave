"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  kemasanSchema,
  type KemasanInput,
  type KemasanFormValues,
} from "@/lib/schemas/kemasan";
import { KEMASAN_JENIS_LABEL, toOptions } from "@/lib/qc/labels";
import { listSupplier } from "@/services/supplier";
import type { KemasanRow } from "@/services/kemasan";
import { useKemasanMutation } from "@/hooks/useKemasan";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: KemasanRow | null;
}

const JENIS_OPTIONS = toOptions(KEMASAN_JENIS_LABEL);

const EMPTY: KemasanFormValues = {
  kode: "",
  nama: "",
  jenis: "polybag",
  ukuran: "",
  bahanKemasan: "",
  supplierId: null,
  biaya: undefined,
  stokMinimum: undefined,
  isActive: true,
};

export function KemasanFormModal({ open, onClose, initialData }: Props) {
  const { create, update } = useKemasanMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const { data: suppliers } = useQuery({
    queryKey: ["supplier"],
    queryFn: () => listSupplier(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<KemasanFormValues, unknown, KemasanInput>({
    resolver: zodResolver(kemasanSchema),
    defaultValues: EMPTY,
  });

  const supplierId = watch("supplierId");
  const isActive = watch("isActive");

  // filter aktif TAPI keep yang sedang terpilih, biar edit value lama tak hilang
  const supplierOptions = useMemo(
    () =>
      (suppliers ?? [])
        .filter((s) => s.isActive || s.id === supplierId)
        .map((s) => ({ value: s.id, label: `${s.kode} — ${s.nama}` })),
    [suppliers, supplierId],
  );

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      reset({
        kode: initialData.kode,
        nama: initialData.nama,
        jenis: initialData.jenis,
        ukuran: initialData.ukuran ?? "",
        bahanKemasan: initialData.bahanKemasan ?? "",
        supplierId: initialData.supplierId ?? null,
        biaya: Number(initialData.biaya),
        stokMinimum: Number(initialData.stokMinimum),
        isActive: initialData.isActive,
      });
    } else {
      reset(EMPTY);
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: KemasanInput) => {
    const res = isEditing
      ? await update.mutateAsync({ id: initialData.id, input: data })
      : await create.mutateAsync(data);
    if (!res.error) onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isPending ? onClose : undefined}
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
          {isEditing ? "Edit Kemasan" : "Tambah Kemasan"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Kode"
              placeholder="Misal: PB-30"
              error={errors.kode?.message}
              {...register("kode")}
              disabled={isPending}
            />
            <Input
              label="Nama Kemasan"
              placeholder="Misal: Polybag 30x40"
              error={errors.nama?.message}
              {...register("nama")}
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Jenis"
              options={JENIS_OPTIONS}
              error={errors.jenis?.message}
              {...register("jenis")}
              disabled={isPending}
            />
            <Input
              label="Ukuran"
              placeholder="Misal: 30x40 cm"
              error={errors.ukuran?.message}
              {...register("ukuran")}
              disabled={isPending}
            />
          </div>

          <Input
            label="Bahan Kemasan"
            placeholder="Misal: PE 0.05mm"
            error={errors.bahanKemasan?.message}
            {...register("bahanKemasan")}
            disabled={isPending}
          />

          <ComboSelect
            label="Supplier"
            options={supplierOptions}
            value={supplierId ?? null}
            onChange={(v) => setValue("supplierId", (v as string) || null)}
            placeholder="Pilih supplier (opsional)"
            disabled={isPending}
            error={errors.supplierId}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput
              decimals={2}
              placeholder="0"
              label="Biaya per Unit"
              error={errors.biaya?.message}
              value={watch("biaya")}
              onChange={(v) =>
                setValue("biaya", v as number, { shouldValidate: true })
              }
              disabled={isPending}
            />
            <NumberInput
              decimals={2}
              placeholder="0"
              label="Stok Minimum"
              error={errors.stokMinimum?.message}
              value={watch("stokMinimum")}
              onChange={(v) =>
                setValue("stokMinimum", v as number, { shouldValidate: true })
              }
              disabled={isPending}
            />
          </div>

          <div className="py-2">
            <Checkbox
              checked={isActive}
              onChange={(checked) => setValue("isActive", checked)}
              disabled={isPending}
              label="Status Aktif"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" loading={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
