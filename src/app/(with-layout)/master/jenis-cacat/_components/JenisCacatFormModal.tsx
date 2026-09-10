"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { jenisCacatSchema, type JenisCacatInput } from "@/lib/schemas/jenis-cacat";
import {
  QC_TINGKAT_LABEL,
  CACAT_KATEGORI_LABEL,
  CACAT_SUMBER_LABEL,
  toOptions,
} from "@/lib/qc/labels";
import type { JenisCacat } from "@/db/schema";
import { useJenisCacatMutation } from "@/hooks/useJenisCacat";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: JenisCacat | null;
}

// konstanta di luar komponen — kalau di dalam, tiap render bikin array baru
const KATEGORI_OPTIONS = toOptions(CACAT_KATEGORI_LABEL);
const KEPARAHAN_OPTIONS = toOptions(QC_TINGKAT_LABEL);
const SUMBER_OPTIONS = toOptions(CACAT_SUMBER_LABEL);

const EMPTY: JenisCacatInput = {
  kode: "",
  nama: "",
  kategori: "jahit",
  keparahan: "minor",
  sumber: "tidak_diketahui",
  dapatDiperbaiki: true,
  tindakanDefault: "",
  isActive: true,
};

export function JenisCacatFormModal({ open, onClose, initialData }: Props) {
  const { create, update } = useJenisCacatMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JenisCacatInput>({
    resolver: zodResolver(jenisCacatSchema),
    defaultValues: EMPTY,
  });

  const dapatDiperbaiki = watch("dapatDiperbaiki");
  const isActive = watch("isActive");

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      reset({
        kode: initialData.kode,
        nama: initialData.nama,
        kategori: initialData.kategori,
        keparahan: initialData.keparahan,
        sumber: initialData.sumber,
        dapatDiperbaiki: initialData.dapatDiperbaiki,
        tindakanDefault: initialData.tindakanDefault ?? "",
        isActive: initialData.isActive,
      });
    } else {
      reset(EMPTY);
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: JenisCacatInput) => {
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
          {isEditing ? "Edit Jenis Cacat" : "Tambah Jenis Cacat"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Kode"
              placeholder="Misal: JHT-01"
              error={errors.kode?.message}
              {...register("kode")}
              disabled={isPending}
            />
            <Input
              label="Nama Cacat"
              placeholder="Misal: Jahitan loncat"
              error={errors.nama?.message}
              {...register("nama")}
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Kategori"
              options={KATEGORI_OPTIONS}
              error={errors.kategori?.message}
              {...register("kategori")}
              disabled={isPending}
            />
            <Select
              label="Keparahan"
              options={KEPARAHAN_OPTIONS}
              error={errors.keparahan?.message}
              {...register("keparahan")}
              disabled={isPending}
            />
          </div>

          <Select
            label="Sumber Cacat"
            options={SUMBER_OPTIONS}
            error={errors.sumber?.message}
            {...register("sumber")}
            disabled={isPending}
          />

          <Input
            label="Tindakan Default"
            placeholder="Misal: Jahit ulang bagian yang loncat"
            error={errors.tindakanDefault?.message}
            {...register("tindakanDefault")}
            disabled={isPending}
          />

          <div className="flex flex-wrap gap-6 py-2">
            <Checkbox
              checked={dapatDiperbaiki}
              onChange={(checked) => setValue("dapatDiperbaiki", checked)}
              disabled={isPending}
              label="Dapat Diperbaiki"
            />
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
