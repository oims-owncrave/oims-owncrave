"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { satuanSchema, type SatuanInput } from "@/lib/schemas/satuan";
import type { Satuan } from "@/db/schema";
import { useSatuanMutation } from "@/hooks/useSatuan";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Satuan | null;
}

export function SatuanFormModal({ open, onClose, initialData }: Props) {
  const { create, update } = useSatuanMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SatuanInput>({
    resolver: zodResolver(satuanSchema),
    defaultValues: {
      nama: "",
      singkatan: "",
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          nama: initialData.nama,
          singkatan: initialData.singkatan,
          isActive: initialData.isActive,
        });
      } else {
        reset({ nama: "", singkatan: "", isActive: true });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = (data: SatuanInput) => {
    if (isEditing && initialData) {
      update.mutate(
        { id: initialData.id, input: data },
        {
          onSuccess: (res) => {
            if (!res.error) onClose();
          },
        },
      );
    } else {
      create.mutate(data, {
        onSuccess: (res) => {
          if (!res.error) onClose();
        },
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
          {isEditing ? "Edit Satuan" : "Tambah Satuan"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nama Satuan"
            placeholder="Misal: Meter"
            error={errors.nama?.message}
            {...register("nama")}
            disabled={isPending}
          />
          <Input
            label="Singkatan"
            placeholder="Misal: m"
            error={errors.singkatan?.message}
            {...register("singkatan")}
            disabled={isPending}
          />

          <div className="flex items-center gap-3 py-2">
            <Checkbox
              checked={isActive}
              onChange={(checked) => setValue("isActive", checked)}
              disabled={isPending}
            />
            <label className="text-sm font-medium text-dark dark:text-white">
              Status Aktif
            </label>
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
