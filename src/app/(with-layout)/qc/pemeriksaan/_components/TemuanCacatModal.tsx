"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { Button } from "@/components/ui/Button";
import {
  temuanCacatSchema,
  type TemuanCacatInput,
  type TemuanCacatFormValues,
} from "@/lib/schemas/temuan-cacat";
import { QC_TINGKAT_LABEL, CACAT_SUMBER_LABEL, toOptions } from "@/lib/qc/labels";
import type { JenisCacat } from "@/db/schema";
import { useTemuanCacatMutation } from "@/hooks/useTemuanCacat";

interface Props {
  open: boolean;
  onClose: () => void;
  hasilQcId: string;
  hasilQcDetailId: string | null;
  /** sisa produk bermasalah yang belum dicatat cacatnya */
  sisa: number;
  cacatOptions: JenisCacat[];
  bagianProdukOptions?: { id: string; kode: string; nama: string; urutan?: number; isActive?: boolean }[];
}

const TINGKAT_OPTIONS = toOptions(QC_TINGKAT_LABEL);
const SUMBER_OPTIONS = toOptions(CACAT_SUMBER_LABEL);

export function TemuanCacatModal({
  open,
  onClose,
  hasilQcId,
  hasilQcDetailId,
  sisa,
  cacatOptions,
  bagianProdukOptions = [],
}: Props) {
  const { create } = useTemuanCacatMutation(hasilQcId);
  const isPending = create.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TemuanCacatFormValues, unknown, TemuanCacatInput>({
    resolver: zodResolver(temuanCacatSchema),
  });

  const jenisCacatId = watch("jenisCacatId");
  const bagianProdukId = watch("bagianProdukId");

  const cacatChoices = useMemo(
    () =>
      cacatOptions
        .filter((c) => c.isActive || c.id === jenisCacatId)
        .map((c) => ({ value: c.id, label: `${c.kode} — ${c.nama}` })),
    [cacatOptions, jenisCacatId],
  );

  const bagianChoices = useMemo(
    () =>
      bagianProdukOptions
        .filter((b) => (b.isActive ?? true) || b.id === bagianProdukId)
        .map((b) => ({ value: b.id, label: `${b.kode} — ${b.nama}` })),
    [bagianProdukOptions, bagianProdukId],
  );

  useEffect(() => {
    if (!open || !hasilQcDetailId) return;
    reset({
      hasilQcDetailId,
      jenisCacatId: "",
      bagianProdukId: "",
      keparahan: "minor",
      sumber: "tidak_diketahui",
      jumlah: 1,
      penyebabAwal: "",
      penanggungJawab: "",
      fotoUrl: "",
      tindakan: "",
    });
  }, [open, hasilQcDetailId, reset]);

  // prefill keparahan + sumber dari master saat jenis cacat dipilih (tetap boleh diubah —
  // yang tersimpan adalah snapshot, bukan join live)
  function pilihJenis(id: string) {
    setValue("jenisCacatId", id);
    const master = cacatOptions.find((c) => c.id === id);
    if (master) {
      setValue("keparahan", master.keparahan);
      setValue("sumber", master.sumber);
      if (master.tindakanDefault) setValue("tindakan", master.tindakanDefault);
    }
  }

  async function onSubmit(data: TemuanCacatInput) {
    const res = await create.mutateAsync(data);
    if (!res.error) onClose();
  }

  if (!open || !hasilQcDetailId) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isPending ? onClose : undefined}
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-1 text-xl font-bold text-dark dark:text-white">Catat Temuan Cacat</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Sisa produk bermasalah yang belum dirinci: <strong>{sisa} pcs</strong>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ComboSelect
            label="Jenis Cacat"
            options={cacatChoices}
            value={jenisCacatId ?? null}
            onChange={(v) => pilihJenis(v as string)}
            placeholder="Pilih jenis cacat"
            disabled={isPending}
            error={errors.jenisCacatId}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Keparahan"
              options={TINGKAT_OPTIONS}
              {...register("keparahan")}
              disabled={isPending}
            />
            <Select
              label="Sumber Cacat"
              options={SUMBER_OPTIONS}
              {...register("sumber")}
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput
              decimals={0}
              placeholder="0"
              label="Jumlah (pcs)"
              error={errors.jumlah?.message}
              value={watch("jumlah")}
              onChange={(v) =>
                setValue("jumlah", v as number, { shouldValidate: true })
              }
              disabled={isPending}
            />
            <ComboSelect
              label="Bagian Produk"
              options={bagianChoices}
              value={bagianProdukId || null}
              onChange={(v) =>
                setValue("bagianProdukId", (v as string) || "", { shouldValidate: true })
              }
              placeholder="Pilih bagian produk"
              clearable
              disabled={isPending}
              error={errors.bagianProdukId}
            />
          </div>

          <Input
            label="Penyebab Awal"
            placeholder="Misal: mesin jahit tension terlalu kencang"
            {...register("penyebabAwal")}
            disabled={isPending}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Penanggung Jawab"
              placeholder="Nama / vendor"
              {...register("penanggungJawab")}
              disabled={isPending}
            />
            <Input
              label="URL Foto Bukti"
              placeholder="https://..."
              {...register("fotoUrl")}
              disabled={isPending}
            />
          </div>

          <Input
            label="Tindakan"
            placeholder="Misal: jahit ulang"
            {...register("tindakan")}
            disabled={isPending}
          />

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" loading={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Temuan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
