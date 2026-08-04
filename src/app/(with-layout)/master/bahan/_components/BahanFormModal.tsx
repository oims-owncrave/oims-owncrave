"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { bahanSchema, type BahanInput } from "@/lib/schemas/bahan";
import { useBahanMutation } from "@/hooks/useBahan";
import type { Kategori, Satuan } from "@/db/schema";

type BahanItem = {
  id: string;
  kode: string;
  nama: string;
  kategoriId: string;
  kategoriNama: string | null;
  satuanId: string;
  satuanNama: string | null;
  satuanSingkatan: string | null;
  stokMinimum: string;
  hargaRataRata: string;
  isActive: boolean;
};

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: BahanItem | null;
  kategoriOptions: Kategori[];
  satuanOptions: Satuan[];
}

export function BahanFormModal({
  open,
  onClose,
  initialData,
  kategoriOptions,
  satuanOptions,
}: Props) {
  const { create, update } = useBahanMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BahanInput>({
    resolver: zodResolver(bahanSchema),
    defaultValues: {
      nama: "",
      kategoriId: "",
      satuanId: "",
      stokMinimum: 0,
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          nama: initialData.nama,
          kategoriId: initialData.kategoriId,
          satuanId: initialData.satuanId,
          stokMinimum: Number(initialData.stokMinimum),
          isActive: initialData.isActive,
        });
      } else {
        reset({
          nama: "",
          kategoriId: "",
          satuanId: "",
          stokMinimum: 0,
          isActive: true,
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = (data: BahanInput) => {
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
          {isEditing ? "Edit Bahan" : "Tambah Bahan"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isEditing && initialData && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Kode Bahan"
                value={initialData.kode}
                disabled
              />
              <Input
                label="Harga Rata²"
                value={new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(Number(initialData.hargaRataRata))}
                disabled
              />
            </div>
          )}

          <Input
            label="Nama Bahan"
            placeholder="Misal: Kain Katun Merah"
            error={errors.nama?.message}
            {...register("nama")}
            disabled={isPending}
          />

          <div className="grid grid-cols-2 gap-4">
            <ComboSelect
              label="Kategori"
              placeholder="Pilih kategori"
              options={kategoriOptions
                .filter((k) => k.isActive || k.id === watch("kategoriId"))
                .map((k) => ({ label: k.nama, value: k.id }))}
              value={watch("kategoriId") || null}
              onChange={(v) => setValue("kategoriId", (v as string) ?? "", { shouldValidate: true })}
              error={errors.kategoriId}
              disabled={isPending}
            />
            <ComboSelect
              label="Satuan"
              placeholder="Pilih satuan"
              options={satuanOptions
                .filter((s) => s.isActive || s.id === watch("satuanId"))
                .map((s) => ({ label: s.nama, value: s.id }))}
              value={watch("satuanId") || null}
              onChange={(v) => setValue("satuanId", (v as string) ?? "", { shouldValidate: true })}
              error={errors.satuanId}
              disabled={isPending}
            />
          </div>

          <Input
            type="number"
            label="Stok Minimum"
            placeholder="0"
            error={errors.stokMinimum?.message}
            {...register("stokMinimum", { valueAsNumber: true })}
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
