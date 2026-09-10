"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  lokasiProduksiSchema,
  type LokasiProduksiInput,
  LOKASI_JENIS,
  LOKASI_JENIS_LABEL,
} from "@/lib/schemas/lokasi-produksi";
import type { Vendor } from "@/db/schema";
import { useLokasiProduksiMutation } from "@/hooks/useLokasiProduksi";
import { generateLokasiKode } from "@/services/lokasi-produksi";
import type { LokasiRow } from "./LokasiTable";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: LokasiRow | null;
  vendorList: Vendor[];
}

const EMPTY: LokasiProduksiInput = {
  kode: "",
  nama: "",
  jenis: "workshop_internal",
  alamat: "",
  kota: "",
  pic: "",
  telepon: "",
  vendorId: null,
  catatan: "",
  isActive: true,
};

export function LokasiFormModal({ open, onClose, initialData, vendorList }: Props) {
  const { create, update } = useLokasiProduksiMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LokasiProduksiInput>({
    resolver: zodResolver(lokasiProduksiSchema),
    defaultValues: EMPTY,
  });

  const isActive = watch("isActive");
  const vendorId = watch("vendorId");

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      reset({
        kode: initialData.kode,
        nama: initialData.nama,
        jenis: initialData.jenis,
        alamat: initialData.alamat ?? "",
        kota: initialData.kota ?? "",
        pic: initialData.pic ?? "",
        telepon: initialData.telepon ?? "",
        vendorId: initialData.vendorId,
        catatan: initialData.catatan ?? "",
        isActive: initialData.isActive,
      });
    } else {
      reset(EMPTY);
      generateLokasiKode().then((kode) => setValue("kode", kode));
    }
  }, [open, initialData, reset, setValue]);

  const onSubmit = async (data: LokasiProduksiInput) => {
    const res = isEditing
      ? await update.mutateAsync({ id: initialData.id, input: data })
      : await create.mutateAsync(data);
    if (!res.error) onClose();
  };

  if (!open) return null;

  // dropdown vendor hanya yang aktif, TAPI tetap tampilkan yang sedang terpilih
  const vendorOptions = [
    { value: "", label: "— Tidak terkait vendor —" },
    ...vendorList
      .filter((v) => v.isActive || v.id === vendorId)
      .map((v) => ({ value: v.id, label: `${v.kode} — ${v.nama}` })),
  ];

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
          {isEditing ? "Edit Lokasi" : "Tambah Lokasi"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Kode Lokasi" placeholder="LOK-0001" error={errors.kode?.message} {...register("kode")} disabled={isPending} />
            <Input label="Nama Lokasi" error={errors.nama?.message} {...register("nama")} disabled={isPending} />
          </div>

          <Select
            label="Jenis Lokasi"
            options={LOKASI_JENIS.map((j) => ({ value: j, label: LOKASI_JENIS_LABEL[j] }))}
            error={errors.jenis?.message}
            {...register("jenis")}
            disabled={isPending}
          />

          <Select
            label="Vendor Pemilik (opsional)"
            options={vendorOptions}
            error={errors.vendorId?.message}
            {...register("vendorId", { setValueAs: (v) => (v === "" ? null : v) })}
            disabled={isPending}
          />

          <Input label="Alamat" error={errors.alamat?.message} {...register("alamat")} disabled={isPending} />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Kota" error={errors.kota?.message} {...register("kota")} disabled={isPending} />
            <Input label="PIC" error={errors.pic?.message} {...register("pic")} disabled={isPending} />
            <Input label="Telepon" error={errors.telepon?.message} {...register("telepon")} disabled={isPending} />
          </div>

          <Input label="Catatan" error={errors.catatan?.message} {...register("catatan")} disabled={isPending} />

          <div className="py-2">
            <Checkbox checked={isActive} onChange={(checked) => setValue("isActive", checked)} disabled={isPending} label="Status Aktif" />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
            <Button type="submit" loading={isPending}>{isPending ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
