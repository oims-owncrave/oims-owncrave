"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { MultiSelect } from "@/components/ui/MultiSelect";
import {
  penjahitSchema,
  type PenjahitInput,
  PENJAHIT_JENIS,
  PENJAHIT_JENIS_LABEL,
} from "@/lib/schemas/penjahit";
import type { Vendor, Produk } from "@/db/schema";
import { usePenjahitMutation } from "@/hooks/usePenjahit";
import { generatePenjahitKode } from "@/services/penjahit";
import type { PenjahitRow } from "./PenjahitTable";
import type { LokasiRow } from "../../lokasi/_components/LokasiTable";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: PenjahitRow | null;
  vendorList: Vendor[];
  lokasiList: LokasiRow[];
  produkList: Produk[];
}

const EMPTY: PenjahitInput = {
  kode: "",
  nama: "",
  jenis: "internal",
  vendorId: null,
  lokasiId: null,
  telepon: "",
  alamat: "",
  kapasitasHarian: null,
  keahlian: [],
  produkIds: [],
  catatan: "",
  isActive: true,
};

export function PenjahitFormModal({
  open,
  onClose,
  initialData,
  vendorList,
  lokasiList,
  produkList,
}: Props) {
  const { create, update } = usePenjahitMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PenjahitInput>({
    resolver: zodResolver(penjahitSchema),
    defaultValues: EMPTY,
  });

  const isActive = watch("isActive");
  const jenis = watch("jenis");
  const vendorId = watch("vendorId");
  const lokasiId = watch("lokasiId");
  const produkIds = watch("produkIds");
  const keahlian = watch("keahlian");

  const butuhVendor = jenis === "anggota_vendor";

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      reset({
        kode: initialData.kode,
        nama: initialData.nama,
        jenis: initialData.jenis,
        vendorId: initialData.vendorId,
        lokasiId: initialData.lokasiId,
        telepon: initialData.telepon ?? "",
        alamat: initialData.alamat ?? "",
        kapasitasHarian: initialData.kapasitasHarian,
        keahlian: initialData.keahlian,
        produkIds: initialData.produkIds,
        catatan: initialData.catatan ?? "",
        isActive: initialData.isActive,
      });
    } else {
      reset(EMPTY);
      generatePenjahitKode("internal").then((kode) => setValue("kode", kode));
    }
  }, [open, initialData, reset, setValue]);

  // ganti jenis: kode ikut prefix (INT/EXT) + bersihkan vendor kalau bukan anggota vendor
  useEffect(() => {
    if (!open || isEditing) return;
    generatePenjahitKode(jenis).then((kode) => setValue("kode", kode));
    if (jenis !== "anggota_vendor") setValue("vendorId", null);
  }, [jenis, open, isEditing, setValue]);

  const onSubmit = async (data: PenjahitInput) => {
    const res = isEditing
      ? await update.mutateAsync({ id: initialData.id, input: data })
      : await create.mutateAsync(data);
    if (!res.error) onClose();
  };

  if (!open) return null;

  const vendorOptions = [
    { value: "", label: "— Pilih vendor —" },
    ...vendorList
      .filter((v) => v.isActive || v.id === vendorId)
      .map((v) => ({ value: v.id, label: `${v.kode} — ${v.nama}` })),
  ];

  const lokasiOptions = [
    { value: "", label: "— Tanpa lokasi —" },
    ...lokasiList
      .filter((l) => l.isActive || l.id === lokasiId)
      .map((l) => ({ value: l.id, label: `${l.kode} — ${l.nama}` })),
  ];

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
          {isEditing ? "Edit Penjahit" : "Tambah Penjahit"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Kode Penjahit" placeholder="JHT-INT-0001" error={errors.kode?.message} {...register("kode")} disabled={isPending} />
            <Input label="Nama Penjahit" error={errors.nama?.message} {...register("nama")} disabled={isPending} />

            <Select
              label="Jenis Penjahit"
              options={PENJAHIT_JENIS.map((j) => ({ value: j, label: PENJAHIT_JENIS_LABEL[j] }))}
              error={errors.jenis?.message}
              {...register("jenis")}
              disabled={isPending}
            />

            {butuhVendor && (
              <Select
                label="Vendor"
                options={vendorOptions}
                error={errors.vendorId?.message}
                {...register("vendorId", { setValueAs: (v) => (v === "" ? null : v) })}
                disabled={isPending}
              />
            )}

            <Select
              label="Lokasi Kerja"
              options={lokasiOptions}
              error={errors.lokasiId?.message}
              {...register("lokasiId", { setValueAs: (v) => (v === "" ? null : v) })}
              disabled={isPending}
            />

            <NumberInput
              label="Kapasitas Harian (pcs)"
              placeholder="0"
              error={errors.kapasitasHarian?.message}
              value={watch("kapasitasHarian")}
              onChange={(v) =>
                setValue("kapasitasHarian", v ?? null, { shouldValidate: true })
              }
              disabled={isPending}
            />

            <Input label="Telepon" error={errors.telepon?.message} {...register("telepon")} disabled={isPending} />
          </div>

          <Input label="Alamat" error={errors.alamat?.message} {...register("alamat")} disabled={isPending} />

          <div>
            <label className="mb-2 block text-body-sm font-medium text-dark dark:text-white">
              Produk yang Biasa Dikerjakan
            </label>
            <MultiSelect
              options={produkList.map((p) => ({ value: p.id, label: `${p.kode} — ${p.nama}` }))}
              value={produkIds}
              onChange={(v) => setValue("produkIds", v)}
              placeholder="Pilih produk"
              searchable
              disabled={isPending}
            />
          </div>

          <div>
            <label className="mb-2 block text-body-sm font-medium text-dark dark:text-white">
              Keahlian
            </label>
            <MultiSelect
              options={[
                { value: "jahit_umum", label: "Jahit Umum" },
                { value: "obras", label: "Obras" },
                { value: "resleting", label: "Pasang Resleting" },
                { value: "kancing", label: "Pasang Kancing" },
                { value: "finishing", label: "Finishing" },
                { value: "sampel", label: "Sampel" },
                { value: "perbaikan", label: "Perbaikan" },
              ]}
              value={keahlian}
              onChange={(v) => setValue("keahlian", v)}
              placeholder="Pilih keahlian"
              disabled={isPending}
            />
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
