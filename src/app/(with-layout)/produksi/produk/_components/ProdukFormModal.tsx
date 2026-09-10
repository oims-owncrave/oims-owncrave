"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { produkSchema, type ProdukInput, DEKORASI_PROSES_LABEL } from "@/lib/schemas/produk";
import { Select } from "@/components/ui/Select";
import type { Produk } from "@/db/schema";
import { useProdukMutation } from "@/hooks/useProduk";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Produk | null;
}

const EMPTY: ProdukInput = {
  kode: "",
  nama: "",
  kategori: "",
  brand: "",
  jenis: "",
  deskripsi: "",
  dekorasiProses: "none",
  isActive: true,
};

export function ProdukFormModal({ open, onClose, initialData }: Props) {
  const { create, update } = useProdukMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProdukInput>({
    resolver: zodResolver(produkSchema),
    defaultValues: EMPTY,
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          kode: initialData.kode,
          nama: initialData.nama,
          kategori: initialData.kategori ?? "",
          brand: initialData.brand ?? "",
          jenis: initialData.jenis ?? "",
          deskripsi: initialData.deskripsi ?? "",
          dekorasiProses: initialData.dekorasiProses,
          isActive: initialData.isActive,
        });
      } else {
        reset(EMPTY);
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: ProdukInput) => {
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
      <div className="relative w-full max-w-lg rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark max-h-[90dvh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
          {isEditing ? "Edit Produk" : "Tambah Produk"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Kode Produk"
              placeholder="Misal: NJK"
              error={errors.kode?.message}
              {...register("kode")}
              disabled={isPending}
            />
            <Input
              label="Nama Produk"
              placeholder="Misal: Nordic Jacket"
              error={errors.nama?.message}
              {...register("nama")}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Kategori"
              placeholder="Misal: Jaket"
              error={errors.kategori?.message}
              {...register("kategori")}
              disabled={isPending}
            />
            <Input
              label="Brand"
              placeholder="Misal: Owncrave"
              error={errors.brand?.message}
              {...register("brand")}
              disabled={isPending}
            />
            <Input
              label="Jenis"
              placeholder="Misal: Outerwear"
              error={errors.jenis?.message}
              {...register("jenis")}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="produk-deskripsi" className="text-sm font-medium text-gray-700">
              Deskripsi
            </label>
            <textarea
              id="produk-deskripsi"
              rows={3}
              placeholder="Deskripsi singkat produk (opsional)"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
              {...register("deskripsi")}
              disabled={isPending}
            />
            {errors.deskripsi && (
              <p className="text-xs text-red-500">{errors.deskripsi.message}</p>
            )}
          </div>

          <Select

            label="Proses Dekorasi"

            options={(["none", "sablon", "bordir", "keduanya"] as const).map((d) => ({

              value: d,

              label: DEKORASI_PROSES_LABEL[d],

            }))}

            error={errors.dekorasiProses?.message}

            {...register("dekorasiProses")}

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
