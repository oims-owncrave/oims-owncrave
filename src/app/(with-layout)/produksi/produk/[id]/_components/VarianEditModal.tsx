"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  varianUpdateSchema,
  type VarianUpdateInput,
} from "@/lib/schemas/varian-produk";
import type { VarianRow } from "@/services/varian-produk";
import { useVarianMutation } from "@/hooks/useVarianProduk";

interface Props {
  open: boolean;
  onClose: () => void;
  produkId: string;
  initialData: VarianRow | null;
}

const JENIS_KELAMIN_OPTIONS = [
  { value: "Pria", label: "Pria" },
  { value: "Wanita", label: "Wanita" },
  { value: "Unisex", label: "Unisex" },
];

export function VarianEditModal({ open, onClose, produkId, initialData }: Props) {
  const { update } = useVarianMutation(produkId);
  const isPending = update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VarianUpdateInput>({
    resolver: zodResolver(varianUpdateSchema),
    defaultValues: { sku: "", jenisKelamin: "", isActive: true },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (open && initialData) {
      reset({
        sku: initialData.sku,
        jenisKelamin: initialData.jenisKelamin ?? "",
        isActive: initialData.isActive,
      });
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: VarianUpdateInput) => {
    if (!initialData) return;
    const res = await update.mutateAsync({ id: initialData.id, input: data });
    if (!res.error) onClose();
  };

  if (!open || !initialData) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-1 text-xl font-bold text-dark dark:text-white">Edit Varian</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {initialData.warnaNama} / {initialData.ukuran}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="SKU"
            placeholder="Misal: NJK-HTM-M"
            error={errors.sku?.message}
            {...register("sku")}
            disabled={isPending}
          />

          <Select
            label="Jenis Kelamin"
            options={JENIS_KELAMIN_OPTIONS}
            placeholder="— Tidak ditentukan —"
            error={errors.jenisKelamin?.message}
            {...register("jenisKelamin")}
            disabled={isPending}
          />

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
