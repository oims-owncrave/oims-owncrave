"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  standarQcSchema,
  type StandarQcInput,
  type StandarQcFormValues,
} from "@/lib/schemas/standar-qc";
import { QC_TINGKAT_LABEL, toOptions } from "@/lib/qc/labels";
import { useStandarQcMutation } from "@/hooks/useStandarQc";

type Opt = { id: string; kode: string; nama: string; isActive: boolean };

interface Props {
  produkOptions: Opt[];
  kategoriOptions: Opt[];
  cacatOptions: Opt[];
  bagianProdukOptions?: { id: string; kode: string; nama: string; urutan?: number; isActive?: boolean }[];
  editId?: string;
  defaultValues?: StandarQcFormValues;
}

const TINGKAT_OPTIONS = toOptions(QC_TINGKAT_LABEL);

const EMPTY_ROW = {
  tahap: "",
  bagianProdukId: null,
  kriteria: "",
  metode: "",
  tingkatKepentingan: "minor" as const,
  toleransi: "",
  jenisCacatId: null,
  tindakanJikaGagal: "",
  wajibFoto: false,
  urutan: 0,
};

export function StandarQcForm({
  produkOptions,
  kategoriOptions,
  cacatOptions,
  bagianProdukOptions = [],
  editId,
  defaultValues,
}: Props) {
  const router = useRouter();
  const { create, update } = useStandarQcMutation();
  const [isCancelling, startCancel] = useTransition();
  const isEditing = !!editId;
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StandarQcFormValues, unknown, StandarQcInput>({
    resolver: zodResolver(standarQcSchema),
    defaultValues: defaultValues ?? {
      nama: "",
      produkId: null,
      kategoriId: null,
      tanggalBerlaku: new Date().toISOString().slice(0, 10),
      catatan: "",
      details: [EMPTY_ROW],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "details" });
  const details = watch("details");
  const produkId = watch("produkId");
  const kategoriId = watch("kategoriId");

  // FK dropdown filter aktif — keep yang sedang terpilih
  const produkChoices = produkOptions
    .filter((p) => p.isActive || p.id === produkId)
    .map((p) => ({ value: p.id, label: `${p.kode} — ${p.nama}` }));
  const kategoriChoices = kategoriOptions
    .filter((k) => k.isActive || k.id === kategoriId)
    .map((k) => ({ value: k.id, label: `${k.kode} — ${k.nama}` }));
  const cacatChoices = (i: number) =>
    cacatOptions
      .filter((c) => c.isActive || c.id === details?.[i]?.jenisCacatId)
      .map((c) => ({ value: c.id, label: `${c.kode} — ${c.nama}` }));

  async function onSubmit(data: StandarQcInput) {
    const res = isEditing
      ? await update.mutateAsync({ id: editId, input: data })
      : await create.mutateAsync(data);
    if (!res.error) router.push("/master/data-qc?tab=standar");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-4 font-semibold text-dark dark:text-white">Informasi Standar</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nama Standar"
            placeholder="Misal: Standar QC Kemeja Formal"
            error={errors.nama?.message}
            {...register("nama")}
            disabled={isPending}
          />
          <Input
            label="Tanggal Berlaku"
            type="date"
            error={errors.tanggalBerlaku?.message}
            {...register("tanggalBerlaku")}
            disabled={isPending}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ComboSelect
            label="Produk"
            options={produkChoices}
            value={produkId ?? null}
            onChange={(v) => setValue("produkId", (v as string) || null)}
            placeholder="Pilih produk (opsional)"
            disabled={isPending}
            error={errors.produkId}
          />
          <ComboSelect
            label="Kategori"
            options={kategoriChoices}
            value={kategoriId ?? null}
            onChange={(v) => setValue("kategoriId", (v as string) || null)}
            placeholder="Pilih kategori (opsional)"
            disabled={isPending}
            error={errors.kategoriId}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Isi minimal salah satu. Produk kosong = standar berlaku untuk seluruh kategori.
        </p>

        <div className="mt-4">
          <Input
            label="Catatan"
            placeholder="Opsional"
            error={errors.catatan?.message}
            {...register("catatan")}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-dark dark:text-white">Kriteria Pemeriksaan</h3>
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ ...EMPTY_ROW, urutan: fields.length })}
            disabled={isPending}
          >
            <Plus size={16} className="mr-1.5" /> Tambah Kriteria
          </Button>
        </div>

        {errors.details?.message && (
          <p className="mb-3 text-sm text-red-600">{errors.details.message}</p>
        )}

        <div className="space-y-4">
          {fields.map((field, i) => (
            <div
              key={field.id}
              className="rounded-lg border border-stroke p-4 dark:border-dark-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-dark dark:text-white">
                  Kriteria #{i + 1}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => remove(i)}
                  disabled={isPending || fields.length === 1}
                  className="h-8 px-2 text-red-600"
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Tahap"
                  placeholder="Misal: Pemeriksaan Akhir"
                  error={errors.details?.[i]?.tahap?.message}
                  {...register(`details.${i}.tahap`)}
                  disabled={isPending}
                />
                <ComboSelect
                  label="Bagian Produk"
                  placeholder="Pilih bagian produk"
                  clearable
                  options={bagianProdukOptions
                    .filter((b) => (b.isActive ?? true) || b.id === watch(`details.${i}.bagianProdukId`))
                    .map((b) => ({ label: `${b.kode} — ${b.nama}`, value: b.id }))}
                  value={watch(`details.${i}.bagianProdukId`) || null}
                  onChange={(v) => setValue(`details.${i}.bagianProdukId`, (v as string) ?? "")}
                  disabled={isPending}
                />
              </div>

              <div className="mt-3">
                <Input
                  label="Kriteria"
                  placeholder="Misal: Jahitan kerah rapi, tidak ada benang menjuntai"
                  error={errors.details?.[i]?.kriteria?.message}
                  {...register(`details.${i}.kriteria`)}
                  disabled={isPending}
                />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Input
                  label="Metode"
                  placeholder="Misal: Visual"
                  {...register(`details.${i}.metode`)}
                  disabled={isPending}
                />
                <Select
                  label="Tingkat Kepentingan"
                  options={TINGKAT_OPTIONS}
                  {...register(`details.${i}.tingkatKepentingan`)}
                  disabled={isPending}
                />
                <Input
                  label="Toleransi"
                  placeholder="Misal: maks 2mm"
                  {...register(`details.${i}.toleransi`)}
                  disabled={isPending}
                />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <ComboSelect
                  label="Jenis Cacat Terkait"
                  options={cacatChoices(i)}
                  value={details?.[i]?.jenisCacatId ?? null}
                  onChange={(v) =>
                    setValue(`details.${i}.jenisCacatId`, (v as string) || null)
                  }
                  placeholder="Opsional"
                  disabled={isPending}
                />
                <Input
                  label="Tindakan Jika Gagal"
                  placeholder="Misal: Kirim ke perbaikan"
                  {...register(`details.${i}.tindakanJikaGagal`)}
                  disabled={isPending}
                />
              </div>

              <div className="mt-3">
                <Checkbox
                  checked={details?.[i]?.wajibFoto ?? false}
                  onChange={(checked) => setValue(`details.${i}.wajibFoto`, checked)}
                  disabled={isPending}
                  label="Wajib foto saat cacat ditemukan"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          loading={isCancelling}
          onClick={() => startCancel(() => router.push("/master/data-qc?tab=standar"))}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button type="submit" loading={isPending}>
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
