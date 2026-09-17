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
  vendorSchema,
  type VendorInput,
  JENIS_PEKERJAAN,
  JENIS_PEKERJAAN_LABEL,
  KAPABILITAS,
  KAPABILITAS_LABEL,
  QC_MODE_LABEL,
} from "@/lib/schemas/vendor";
import type { Vendor } from "@/db/schema";
import { useVendorMutation } from "@/hooks/useVendor";
import { generateVendorKode } from "@/services/vendor";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Vendor | null;
}

const EMPTY: VendorInput = {
  kode: "",
  nama: "",
  pemilik: "",
  kontak: "",
  telepon: "",
  email: "",
  alamat: "",
  kota: "",
  kapasitasHarian: null,
  jenisPekerjaan: [],
  kapabilitas: ["jahit"],
  bankNama: "",
  bankNomorRekening: "",
  bankAtasNama: "",
  terminHari: null,
  leadTimeHari: null,
  qcMode: "internal",
  qcOfficer: "",
  catatan: "",
  isActive: true,
};

export function VendorFormModal({ open, onClose, initialData }: Props) {
  const { create, update } = useVendorMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VendorInput>({
    resolver: zodResolver(vendorSchema),
    defaultValues: EMPTY,
  });

  const isActive = watch("isActive");
  const kapabilitas = watch("kapabilitas");
  const jenisPekerjaan = watch("jenisPekerjaan");
  const qcMode = watch("qcMode");

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      reset({
        kode: initialData.kode,
        nama: initialData.nama,
        pemilik: initialData.pemilik ?? "",
        kontak: initialData.kontak ?? "",
        telepon: initialData.telepon ?? "",
        email: initialData.email ?? "",
        alamat: initialData.alamat ?? "",
        kota: initialData.kota ?? "",
        kapasitasHarian: initialData.kapasitasHarian,
        jenisPekerjaan: initialData.jenisPekerjaan,
        kapabilitas: initialData.kapabilitas,
        bankNama: initialData.bankNama ?? "",
        bankNomorRekening: initialData.bankNomorRekening ?? "",
        bankAtasNama: initialData.bankAtasNama ?? "",
        terminHari: initialData.terminHari,
        leadTimeHari: initialData.leadTimeHari,
        qcMode: initialData.qcMode,
        qcOfficer: initialData.qcOfficer ?? "",
        catatan: initialData.catatan ?? "",
        isActive: initialData.isActive,
      });
    } else {
      reset(EMPTY);
      // kode auto VDR-NNNN untuk entri baru
      generateVendorKode().then((kode) => setValue("kode", kode));
    }
  }, [open, initialData, reset, setValue]);

  const onSubmit = async (data: VendorInput) => {
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
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
          {isEditing ? "Edit Vendor" : "Tambah Vendor"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Kode Vendor"
              placeholder="VDR-0001"
              error={errors.kode?.message}
              {...register("kode")}
              disabled={isPending}
            />
            <Input
              label="Nama Vendor"
              placeholder="Misal: CV Jahit Makmur"
              error={errors.nama?.message}
              {...register("nama")}
              disabled={isPending}
            />
            <Input
              label="Pemilik"
              error={errors.pemilik?.message}
              {...register("pemilik")}
              disabled={isPending}
            />
            <Input
              label="Kontak / PIC"
              error={errors.kontak?.message}
              {...register("kontak")}
              disabled={isPending}
            />
            <Input
              label="Telepon"
              error={errors.telepon?.message}
              {...register("telepon")}
              disabled={isPending}
            />
            <Input
              label="Email"
              error={errors.email?.message}
              {...register("email")}
              disabled={isPending}
            />
            <Input
              label="Kota"
              error={errors.kota?.message}
              {...register("kota")}
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
          </div>

          <Input
            label="Alamat"
            error={errors.alamat?.message}
            {...register("alamat")}
            disabled={isPending}
          />

          <div>
            <label className="mb-2 block text-body-sm font-medium text-dark dark:text-white">
              Kapabilitas
            </label>
            <MultiSelect
              options={KAPABILITAS.map((k) => ({ value: k, label: KAPABILITAS_LABEL[k] }))}
              value={kapabilitas}
              onChange={(v) => setValue("kapabilitas", v as VendorInput["kapabilitas"])}
              placeholder="Pilih kapabilitas"
              disabled={isPending}
            />
            {errors.kapabilitas && (
              <p className="mt-1 text-sm text-red-500">{errors.kapabilitas.message}</p>
            )}
            <p className="mt-1 text-xs text-dark-5 dark:text-dark-6">
              Vendor sablon/bordir dipakai untuk pekerjaan dekorasi.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-body-sm font-medium text-dark dark:text-white">
              Jenis Pekerjaan
            </label>
            <MultiSelect
              options={JENIS_PEKERJAAN.map((j) => ({
                value: j,
                label: JENIS_PEKERJAAN_LABEL[j],
              }))}
              value={jenisPekerjaan}
              onChange={(v) => setValue("jenisPekerjaan", v as VendorInput["jenisPekerjaan"])}
              placeholder="Pilih jenis pekerjaan"
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Mode QC"
              options={(["internal", "vendor"] as const).map((m) => ({
                value: m,
                label: QC_MODE_LABEL[m],
              }))}
              error={errors.qcMode?.message}
              {...register("qcMode")}
              disabled={isPending}
            />
            {qcMode === "vendor" && (
              <Input
                label="Petugas QC di Vendor"
                error={errors.qcOfficer?.message}
                {...register("qcOfficer")}
                disabled={isPending}
              />
            )}
            <NumberInput
              label="Termin Bayar (hari)"
              placeholder="0"
              error={errors.terminHari?.message}
              value={watch("terminHari")}
              onChange={(v) =>
                setValue("terminHari", v ?? null, { shouldValidate: true })
              }
              disabled={isPending}
            />
            <NumberInput
              label="Lead Time (hari)"
              placeholder="0"
              error={errors.leadTimeHari?.message}
              value={watch("leadTimeHari")}
              onChange={(v) =>
                setValue("leadTimeHari", v ?? null, { shouldValidate: true })
              }
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Nama Bank"
              error={errors.bankNama?.message}
              {...register("bankNama")}
              disabled={isPending}
            />
            <Input
              label="Nomor Rekening"
              error={errors.bankNomorRekening?.message}
              {...register("bankNomorRekening")}
              disabled={isPending}
            />
            <Input
              label="Atas Nama"
              error={errors.bankAtasNama?.message}
              {...register("bankAtasNama")}
              disabled={isPending}
            />
          </div>

          <Input
            label="Catatan"
            error={errors.catatan?.message}
            {...register("catatan")}
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
