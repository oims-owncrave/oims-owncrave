"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  tarifJasaJahitSchema,
  type TarifJasaJahitInput,
  DASAR_TARIF,
  DASAR_TARIF_LABEL,
} from "@/lib/schemas/tarif-jasa-jahit";
import { JENIS_PEKERJAAN, JENIS_PEKERJAAN_LABEL } from "@/lib/schemas/vendor";
import type { Vendor, Produk } from "@/db/schema";
import { useTarifJasaJahitMutation } from "@/hooks/useTarifJasaJahit";
import { getProdukDetail, type VarianRow } from "@/services/varian-produk";
import type { TarifRow } from "./TarifTable";
import type { PenjahitRow } from "../../penjahit/_components/PenjahitTable";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: TarifRow | null;
  vendorList: Vendor[];
  penjahitList: PenjahitRow[];
  produkList: Produk[];
}

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY: TarifJasaJahitInput = {
  produkId: "",
  varianId: null,
  jenisPekerjaan: "jahit_penuh",
  pihak: "vendor",
  vendorId: null,
  penjahitId: null,
  dasarTarif: "per_pcs",
  nominal: 0,
  tanggalBerlaku: today(),
  catatan: "",
};

export function TarifFormModal({
  open,
  onClose,
  initialData,
  vendorList,
  penjahitList,
  produkList,
}: Props) {
  const { create, update } = useTarifJasaJahitMutation();
  const isEditing = !!initialData;
  const isPending = create.isPending || update.isPending;
  const [varianList, setVarianList] = useState<VarianRow[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TarifJasaJahitInput>({
    resolver: zodResolver(tarifJasaJahitSchema),
    defaultValues: EMPTY,
  });

  const produkId = watch("produkId");
  const pihak = watch("pihak");
  const vendorId = watch("vendorId");
  const penjahitId = watch("penjahitId");

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      reset({
        produkId: initialData.produkId,
        varianId: initialData.varianId,
        jenisPekerjaan: initialData.jenisPekerjaan,
        pihak: initialData.vendorId ? "vendor" : "penjahit",
        vendorId: initialData.vendorId,
        penjahitId: initialData.penjahitId,
        dasarTarif: initialData.dasarTarif,
        nominal: Number(initialData.nominal),
        tanggalBerlaku: new Date(initialData.tanggalBerlaku).toISOString().slice(0, 10),
        catatan: initialData.catatan ?? "",
      });
    } else {
      reset({ ...EMPTY, tanggalBerlaku: today() });
    }
  }, [open, initialData, reset]);

  // varian ikut produk yang dipilih
  useEffect(() => {
    if (!produkId) {
      setVarianList([]);
      return;
    }
    getProdukDetail(produkId).then((d) => setVarianList(d?.varian ?? []));
  }, [produkId]);

  // ganti pihak: bersihkan sisi lain (DB CHECK: tepat satu terisi)
  useEffect(() => {
    if (pihak === "vendor") setValue("penjahitId", null);
    else setValue("vendorId", null);
  }, [pihak, setValue]);

  const onSubmit = async (data: TarifJasaJahitInput) => {
    const res = isEditing
      ? await update.mutateAsync({ id: initialData.id, input: data })
      : await create.mutateAsync(data);
    if (!res.error) onClose();
  };

  if (!open) return null;

  const produkOptions = [
    { value: "", label: "— Pilih produk —" },
    ...produkList
      .filter((p) => p.isActive || p.id === produkId)
      .map((p) => ({ value: p.id, label: `${p.kode} — ${p.nama}` })),
  ];
  const varianOptions = [
    { value: "", label: "Semua varian" },
    ...varianList.map((v) => ({ value: v.id, label: `${v.sku} (${v.warnaNama} / ${v.ukuran})` })),
  ];
  const vendorOptions = [
    { value: "", label: "— Pilih vendor —" },
    ...vendorList
      .filter((v) => v.isActive || v.id === vendorId)
      .map((v) => ({ value: v.id, label: `${v.kode} — ${v.nama}` })),
  ];
  const penjahitOptions = [
    { value: "", label: "— Pilih penjahit —" },
    ...penjahitList
      .filter((p) => p.isActive || p.id === penjahitId)
      .map((p) => ({ value: p.id, label: `${p.kode} — ${p.nama}` })),
  ];
  const nullable = (v: string) => (v === "" ? null : v);

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
          {isEditing ? `Edit Tarif (draft v${initialData.versi})` : "Tambah Tarif"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Produk"
            options={produkOptions}
            error={errors.produkId?.message}
            {...register("produkId")}
            disabled={isPending || isEditing}
          />
          <Select
            label="Varian"
            options={varianOptions}
            error={errors.varianId?.message}
            {...register("varianId", { setValueAs: nullable })}
            disabled={isPending || !produkId}
          />
          <Select
            label="Jenis Pekerjaan"
            options={JENIS_PEKERJAAN.map((j) => ({ value: j, label: JENIS_PEKERJAAN_LABEL[j] }))}
            error={errors.jenisPekerjaan?.message}
            {...register("jenisPekerjaan")}
            disabled={isPending}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Berlaku untuk"
              options={[
                { value: "vendor", label: "Vendor" },
                { value: "penjahit", label: "Penjahit" },
              ]}
              {...register("pihak")}
              disabled={isPending}
            />
            {pihak === "vendor" ? (
              <Select
                label="Vendor"
                options={vendorOptions}
                error={errors.vendorId?.message}
                {...register("vendorId", { setValueAs: nullable })}
                disabled={isPending}
              />
            ) : (
              <Select
                label="Penjahit"
                options={penjahitOptions}
                error={errors.penjahitId?.message}
                {...register("penjahitId", { setValueAs: nullable })}
                disabled={isPending}
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Dasar Tarif"
              options={DASAR_TARIF.map((d) => ({ value: d, label: DASAR_TARIF_LABEL[d] }))}
              error={errors.dasarTarif?.message}
              {...register("dasarTarif")}
              disabled={isPending}
            />
            <Input
              label="Nominal (Rp)"
              type="number"
              error={errors.nominal?.message}
              {...register("nominal", { valueAsNumber: true })}
              disabled={isPending}
            />
            <Input
              label="Berlaku Sejak"
              type="date"
              error={errors.tanggalBerlaku?.message}
              {...register("tanggalBerlaku")}
              disabled={isPending}
            />
          </div>

          <Input label="Catatan" error={errors.catatan?.message} {...register("catatan")} disabled={isPending} />

          <p className="text-xs text-dark-5 dark:text-dark-6">
            Disimpan sebagai <strong>draft</strong>. Aktifkan dari tabel untuk memberlakukan.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
            <Button type="submit" loading={isPending}>{isPending ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
