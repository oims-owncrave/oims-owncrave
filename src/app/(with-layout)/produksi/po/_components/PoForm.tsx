"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { poSchema, type PoInput, PO_JENIS } from "@/lib/schemas/po-produksi";
import { usePoMutation } from "@/hooks/usePoProduksi";
import { useProdukDetail } from "@/hooks/useVarianProduk";
import type { PicOption } from "@/services/po-produksi";

type ProdukOption = { id: string; kode: string; nama: string; isActive: boolean };

interface Props {
  produkOptions: ProdukOption[];
  picOptions: PicOption[];
  editId?: string;
  defaultValues?: PoInput;
}

const EMPTY_ROW = { varianId: "", jumlahTarget: 0, toleransiPersen: 0 };

const PRIORITAS_OPTIONS = [
  { value: "rendah", label: "Rendah" },
  { value: "normal", label: "Normal" },
  { value: "tinggi", label: "Tinggi" },
  { value: "urgent", label: "Urgent" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function PoForm({ produkOptions, picOptions, editId, defaultValues }: Props) {
  const router = useRouter();
  const { create, update } = usePoMutation();
  const [isCancelling, startCancel] = useTransition();
  const isEditing = !!editId;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PoInput>({
    resolver: zodResolver(poSchema),
    defaultValues: defaultValues ?? {
      produkId: "",
      tanggal: todayISO(),
      tanggalMulai: "",
      targetSelesai: "",
      prioritas: "normal",
      jenis: "reguler",
      penanggungJawab: "",
      catatan: "",
      details: [EMPTY_ROW],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "details" });
  const details = watch("details");
  const produkId = watch("produkId");

  // Varian dari produk terpilih (fetch client-side saat produk dipilih)
  const { data: produkDetail } = useProdukDetail(produkId || "");
  const varianOptions = (produkId && produkDetail?.varian) || [];
  const aktifVarian = varianOptions.filter((v) => v.isActive);

  const produkChoices = produkOptions.filter((p) => p.isActive || p.id === produkId);

  const totalTarget = (details ?? []).reduce((s, d) => s + (Number(d.jumlahTarget) || 0), 0);
  const totalRencana = (details ?? []).reduce(
    (s, d) =>
      s + Math.ceil((Number(d.jumlahTarget) || 0) * (1 + (Number(d.toleransiPersen) || 0) / 100)),
    0,
  );

  async function onSubmit(data: PoInput) {
    const res = isEditing
      ? await update.mutateAsync({ id: editId, input: data })
      : await create.mutateAsync(data);
    if (!res.error) router.push("/produksi/po");
  }

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header card */}
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="Produk"
            required
            placeholder="Pilih produk"
            options={produkChoices.map((p) => ({ label: `${p.kode} — ${p.nama}`, value: p.id }))}
            value={produkId || null}
            onChange={(v) => {
              setValue("produkId", (v as string) ?? "", { shouldValidate: true });
              // reset baris varian saat ganti produk — varian terikat produk
              setValue("details", [EMPTY_ROW]);
            }}
            error={errors.produkId}
            disabled={isEditing}
          />
          <Input
            type="date"
            label="Tanggal"
            required
            {...register("tanggal")}
            error={errors.tanggal?.message}
          />
          <Input
            type="date"
            label="Tanggal Mulai"
            {...register("tanggalMulai")}
            error={errors.tanggalMulai?.message}
          />
          <Input
            type="date"
            label="Target Selesai"
            {...register("targetSelesai")}
            error={errors.targetSelesai?.message}
          />
          <Select
            label="Jenis Produksi"
            options={PO_JENIS.map((j) => ({ value: j.value, label: j.label }))}
            {...register("jenis")}
            error={errors.jenis?.message}
          />
          <Select
            label="Prioritas"
            options={PRIORITAS_OPTIONS}
            {...register("prioritas")}
            error={errors.prioritas?.message}
          />
          <ComboSelect
            label="Penanggung Jawab"
            placeholder="Pilih user (opsional)"
            options={picOptions.map((u) => ({ label: u.displayName, value: u.id }))}
            value={watch("penanggungJawab") || null}
            onChange={(v) => setValue("penanggungJawab", (v as string) ?? "")}
          />
          <Input
            label="Catatan"
            placeholder="Opsional"
            {...register("catatan")}
            error={errors.catatan?.message}
          />
        </div>
        {isEditing && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Produk tidak bisa diganti saat edit — buat PO baru untuk produk lain.
          </p>
        )}
      </div>

      {/* Detail per SKU */}
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-dark dark:text-white">Target per SKU</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_ROW)} disabled={!produkId}>
            <Plus size={16} className="mr-1.5" />
            Tambah SKU
          </Button>
        </div>

        {!produkId && (
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">Pilih produk dulu untuk memilih varian.</p>
        )}
        {typeof errors.details?.message === "string" && (
          <p className="mb-3 text-xs text-red-500">{errors.details.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => {
            const row = details?.[index];
            const rencana = Math.ceil(
              (Number(row?.jumlahTarget) || 0) * (1 + (Number(row?.toleransiPersen) || 0) / 100),
            );
            return (
              <div
                key={field.id}
                className="rounded-lg border border-stroke p-4 dark:border-dark-3 md:border-none md:p-0 md:border-b md:pb-3 md:last:border-none"
              >
                <div className="mb-3 flex items-center justify-between md:hidden">
                  <span className="text-xs font-semibold text-dark-5 dark:text-dark-6">SKU #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length <= 1}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem]">
                  <ComboSelect
                    label={index === 0 ? "Varian (SKU)" : undefined}
                    placeholder="Pilih varian"
                    options={aktifVarian
                      .filter(
                        (v) =>
                          v.id === row?.varianId ||
                          !details?.some((d, di) => di !== index && d.varianId === v.id),
                      )
                      .map((v) => ({
                        label: `${v.sku} (${v.warnaNama}/${v.ukuran})`,
                        value: v.id,
                      }))}
                    value={row?.varianId || null}
                    onChange={(v) =>
                      setValue(`details.${index}.varianId`, (v as string) ?? "", { shouldValidate: true })
                    }
                    error={errors.details?.[index]?.varianId}
                    disabled={!produkId}
                  />

                  <Input
                    type="number"
                    step="1"
                    label={index === 0 ? "Target (pcs)" : undefined}
                    {...register(`details.${index}.jumlahTarget`, { valueAsNumber: true })}
                    error={errors.details?.[index]?.jumlahTarget?.message}
                  />

                  <Input
                    type="number"
                    step="0.5"
                    label={index === 0 ? "Toleransi (%)" : undefined}
                    {...register(`details.${index}.toleransiPersen`, { valueAsNumber: true })}
                    error={errors.details?.[index]?.toleransiPersen?.message}
                  />

                  <div className="flex items-center justify-between border-t border-stroke/40 pt-2 dark:border-dark-3/40 md:block md:border-t-0 md:pt-0">
                    <span className="text-xs text-dark-5 dark:text-dark-6 md:hidden">Rencana Cutting:</span>
                    <label className={`mb-2 hidden text-right text-sm font-medium text-dark dark:text-white md:block ${index === 0 ? "" : "invisible"}`}>
                      Rencana Cutting
                    </label>
                    <div className="flex h-10 items-center justify-end px-0 text-sm font-semibold text-dark dark:text-white md:px-4 md:font-medium">
                      {rencana} pcs
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <div className={`mb-2 h-5 ${index === 0 ? "block" : "invisible"}`} aria-hidden />
                    <div className="flex h-10 items-center justify-center">
                      <button
                        type="button"
                        onClick={() => fields.length > 1 && remove(index)}
                        disabled={fields.length <= 1}
                        className="rounded p-2 text-dark-5 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent dark:text-dark-6 dark:hover:bg-red-500/10"
                        title="Hapus baris"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end gap-6 border-t border-stroke pt-4 dark:border-dark-3">
          <div className="text-right">
            <span className="text-sm text-dark-5 dark:text-dark-6">Total Target</span>
            <p className="text-lg font-bold text-dark dark:text-white">{totalTarget} pcs</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-dark-5 dark:text-dark-6">Total Rencana Cutting</span>
            <p className="text-lg font-bold text-dark dark:text-white">{totalRencana} pcs</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          loading={isCancelling}
          onClick={() => startCancel(() => router.push("/produksi/po"))}
        >
          Batal
        </Button>
        <Button type="submit" loading={isPending}>
          {isEditing ? "Simpan Perubahan" : "Simpan (Draft)"}
        </Button>
      </div>
    </form>
  );
}
