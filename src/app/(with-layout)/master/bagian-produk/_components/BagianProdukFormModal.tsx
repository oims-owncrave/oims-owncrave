"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { bagianProdukSchema, type BagianProdukInput } from "@/lib/schemas/bagian-produk";
import { generateBagianProdukKode, type BagianProdukRow } from "@/services/bagian-produk";
import { useBagianProdukMutation } from "@/hooks/useBagianProduk";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: BagianProdukRow | null;
  defaultUrutan?: number;
}

const EMPTY: BagianProdukInput = {
  kode: "",
  nama: "",
  urutan: 0,
  isActive: true,
};

export function BagianProdukFormModal({ open, onClose, initialData, defaultUrutan = 0 }: Props) {
  const { create, update } = useBagianProdukMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BagianProdukInput>({
    resolver: zodResolver(bagianProdukSchema),
    defaultValues: EMPTY,
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      reset({
        kode: initialData.kode,
        nama: initialData.nama,
        urutan: initialData.urutan,
        isActive: initialData.isActive,
      });
    } else {
      reset({
        ...EMPTY,
        urutan: defaultUrutan,
      });
      generateBagianProdukKode().then((kode) => {
        setValue("kode", kode);
      });
    }
  }, [open, initialData, defaultUrutan, reset, setValue]);

  async function onSubmit(data: BagianProdukInput) {
    if (isEditing && initialData) {
      const res = await update.mutateAsync({ id: initialData.id, input: data });
      if (!res.error) onClose();
    } else {
      const res = await create.mutateAsync(data);
      if (!res.error) onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isPending ? onClose : undefined}
      />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
          {isEditing ? "Edit Bagian Produk" : "Tambah Bagian Produk"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Kode"
            placeholder="BP-01"
            required
            error={errors.kode?.message}
            {...register("kode")}
            disabled={isPending}
          />

          <Input
            label="Nama Bagian"
            placeholder="Misal: Kerah, Lengan, Saku"
            required
            error={errors.nama?.message}
            {...register("nama")}
            disabled={isPending}
          />

          <NumberInput
            decimals={0}
            placeholder="10"
            label="Urutan Tampil"
            value={watch("urutan")}
            onChange={(v) => setValue("urutan", (v as number) ?? 0, { shouldValidate: true })}
            error={errors.urutan?.message}
            disabled={isPending}
          />

          <Checkbox
            label="Aktif"
            checked={isActive}
            onChange={(checked) => setValue("isActive", checked)}
            disabled={isPending}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" loading={isPending}>
              {isEditing ? "Simpan Perubahan" : "Tambah Bagian"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
