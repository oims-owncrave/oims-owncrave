"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { warnaSchema, type WarnaInput } from "@/lib/schemas/warna";
import type { Warna } from "@/db/schema";
import { useWarnaMutation } from "@/hooks/useWarna";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Warna | null;
}

export function WarnaFormModal({ open, onClose, initialData }: Props) {
  const { create, update } = useWarnaMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WarnaInput>({
    resolver: zodResolver(warnaSchema),
    defaultValues: { kode: "", nama: "", isActive: true },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({ kode: initialData.kode, nama: initialData.nama, isActive: initialData.isActive });
      } else {
        reset({ kode: "", nama: "", isActive: true });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: WarnaInput) => {
    if (isEditing) {
      const res = await update.mutateAsync({ id: initialData.id, input: data });
      if (!res.error) onClose();
    } else {
      const res = await create.mutateAsync(data);
      if (!res.error) onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
          {isEditing ? "Edit Warna" : "Tambah Warna"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Kode Warna"
            placeholder="Misal: MRH"
            error={errors.kode?.message}
            {...register("kode")}
            disabled={isPending}
          />
          <Input
            label="Nama Warna"
            placeholder="Misal: Merah"
            error={errors.nama?.message}
            {...register("nama")}
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
