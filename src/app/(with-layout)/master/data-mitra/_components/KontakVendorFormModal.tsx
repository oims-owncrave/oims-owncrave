"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  kontakVendorSchema,
  type KontakVendorInput,
} from "@/lib/schemas/kontak-vendor";
import type { Vendor } from "@/db/schema";
import { useKontakVendorMutation } from "@/hooks/useKontakVendor";
import type { KontakVendorRow } from "@/services/kontak-vendor";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: KontakVendorRow | null;
  vendorList: Vendor[];
}

const EMPTY: KontakVendorInput = {
  vendorId: "",
  nama: "",
  jabatan: "",
  telepon: "",
  isActive: true,
};

export function KontakVendorFormModal({
  open,
  onClose,
  initialData,
  vendorList,
}: Props) {
  const { create, update } = useKontakVendorMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<KontakVendorInput>({
    resolver: zodResolver(kontakVendorSchema),
    defaultValues: EMPTY,
  });

  const isActive = watch("isActive");
  const vendorId = watch("vendorId");

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      reset({
        vendorId: initialData.vendorId,
        nama: initialData.nama,
        jabatan: initialData.jabatan ?? "",
        telepon: initialData.telepon ?? "",
        isActive: initialData.isActive,
      });
    } else {
      reset(EMPTY);
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: KontakVendorInput) => {
    const res = isEditing
      ? await update.mutateAsync({ id: initialData.id, input: data })
      : await create.mutateAsync(data);
    if (!res.error) onClose();
  };

  if (!open) return null;

  const vendorOptions = vendorList
    .filter((v) => v.isActive || v.id === vendorId)
    .map((v) => ({ value: v.id, label: `${v.kode} — ${v.nama}` }));

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isPending ? onClose : undefined}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
          {isEditing ? "Edit Kontak Vendor" : "Tambah Kontak Vendor"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <ComboSelect
              label="Vendor"
              required
              options={vendorOptions}
              value={vendorId || null}
              onChange={(v) => setValue("vendorId", (v as string) || "", { shouldValidate: true })}
              placeholder="Pilih vendor..."
              disabled={isPending}
              error={errors.vendorId}
            />
          </div>

          <Input
            label="Nama Kontak"
            required
            placeholder="Contoh: Pak Agus"
            error={errors.nama?.message}
            {...register("nama")}
            disabled={isPending}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Jabatan (opsional)"
              placeholder="Contoh: Koordinator Jahit"
              error={errors.jabatan?.message}
              {...register("jabatan")}
              disabled={isPending}
            />
            <Input
              label="Telepon / WA (opsional)"
              placeholder="Contoh: 08123456789"
              error={errors.telepon?.message}
              {...register("telepon")}
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
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
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
