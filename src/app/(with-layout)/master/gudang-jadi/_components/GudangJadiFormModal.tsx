"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  gudangBarangJadiSchema,
  type GudangBarangJadiInput,
} from "@/lib/schemas/gudang-barang-jadi";
import { GUDANG_JENIS_LABEL, toOptions } from "@/lib/qc/labels";
import type { GudangBarangJadi } from "@/db/schema";
import { useGudangBarangJadiMutation } from "@/hooks/useGudangBarangJadi";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: GudangBarangJadi | null;
}

const JENIS_OPTIONS = toOptions(GUDANG_JENIS_LABEL);

const EMPTY: GudangBarangJadiInput = {
  kode: "",
  nama: "",
  jenis: "gudang_utama",
  alamat: "",
  picNama: "",
  isDefault: false,
  isActive: true,
};

export function GudangJadiFormModal({ open, onClose, initialData }: Props) {
  const { create, update } = useGudangBarangJadiMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GudangBarangJadiInput>({
    resolver: zodResolver(gudangBarangJadiSchema),
    defaultValues: EMPTY,
  });

  const isDefault = watch("isDefault");
  const isActive = watch("isActive");

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      reset({
        kode: initialData.kode,
        nama: initialData.nama,
        jenis: initialData.jenis,
        alamat: initialData.alamat ?? "",
        picNama: initialData.picNama ?? "",
        isDefault: initialData.isDefault,
        isActive: initialData.isActive,
      });
    } else {
      reset(EMPTY);
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: GudangBarangJadiInput) => {
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
          {isEditing ? "Edit Gudang" : "Tambah Gudang"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Kode"
              placeholder="Misal: GD-01"
              error={errors.kode?.message}
              {...register("kode")}
              disabled={isPending}
            />
            <Input
              label="Nama Gudang"
              placeholder="Misal: Gudang Utama"
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
              label="PIC"
              placeholder="Nama penanggung jawab"
              error={errors.picNama?.message}
              {...register("picNama")}
              disabled={isPending}
            />
          </div>

          <Input
            label="Alamat"
            placeholder="Alamat gudang"
            error={errors.alamat?.message}
            {...register("alamat")}
            disabled={isPending}
          />

          <div className="flex flex-wrap gap-6 py-2">
            <Checkbox
              checked={isDefault}
              onChange={(checked) => setValue("isDefault", checked)}
              disabled={isPending}
              label="Jadikan Gudang Default"
            />
            <Checkbox
              checked={isActive}
              onChange={(checked) => setValue("isActive", checked)}
              disabled={isPending}
              label="Status Aktif"
            />
          </div>
          {isDefault && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Gudang default lama otomatis dilepas — hanya boleh ada satu default.
            </p>
          )}

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
