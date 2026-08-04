"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { supplierSchema, type SupplierInput } from "@/lib/schemas/supplier";
import type { Supplier } from "@/db/schema";
import { useSupplierMutation } from "@/hooks/useSupplier";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Supplier | null;
}

export function SupplierFormModal({ open, onClose, initialData }: Props) {
  const { create, update } = useSupplierMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      kode: "",
      nama: "",
      kontak: "",
      alamat: "",
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          kode: initialData.kode,
          nama: initialData.nama,
          kontak: initialData.kontak ?? "",
          alamat: initialData.alamat ?? "",
          isActive: initialData.isActive,
        });
      } else {
        reset({ kode: "", nama: "", kontak: "", alamat: "", isActive: true });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = (data: SupplierInput) => {
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
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
          {isEditing ? "Edit Supplier" : "Tambah Supplier"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Kode Supplier"
            placeholder="Misal: SUP-001"
            error={errors.kode?.message}
            {...register("kode")}
            disabled={isPending}
          />
          <Input
            label="Nama Supplier"
            placeholder="Misal: PT Kain Jaya"
            error={errors.nama?.message}
            {...register("nama")}
            disabled={isPending}
          />
          <Input
            label="Kontak (Opsional)"
            placeholder="Misal: 08123456789 / Budi"
            error={errors.kontak?.message}
            {...register("kontak")}
            disabled={isPending}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark dark:text-white">
              Alamat (Opsional)
            </label>
            <textarea
              placeholder="Alamat lengkap supplier..."
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              rows={3}
              {...register("alamat")}
              disabled={isPending}
            />
            {errors.alamat?.message && (
              <p className="text-sm text-red-500">{errors.alamat.message}</p>
            )}
          </div>

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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
