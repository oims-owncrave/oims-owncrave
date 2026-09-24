"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useState, useTransition, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { ImportExcelModal } from "@/components/ui/import/ImportExcelModal";
import { BOM_IMPORT_COLUMNS } from "@/lib/import/bom-columns";
import { resolveBomImportRows } from "@/services/import";
import { bomSchema, type BomInput } from "@/lib/schemas/bom";
import { useBomMutation } from "@/hooks/useBom";

type ProdukOption = { id: string; kode: string; nama: string; isActive: boolean };
type BahanOption = {
  id: string;
  kode: string;
  nama: string;
  ukuran?: string | null;
  satuanSingkatan: string | null;
  isActive: boolean;
};

interface Props {
  produkOptions: ProdukOption[];
  bahanOptions: BahanOption[];
  /** ukuran varian aktif per produk, untuk isi pilihan MultiSelect kolom Ukuran */
  ukuranPerProduk: Record<string, string[]>;
  /** warna varian aktif per produk, untuk isi pilihan MultiSelect kolom Warna */
  warnaPerProduk: Record<string, { id: string; nama: string }[]>;
  /** Mode edit (draft only): id + defaultValues terisi */
  editId?: string;
  defaultValues?: BomInput;
}

const EMPTY_ROW = {
  bahanId: "",
  kuantitas: undefined as unknown as number,
  berlakuUkuran: "",
  berlakuWarnaIds: [] as string[],
  keterangan: "",
};

export function BomForm({ produkOptions, bahanOptions, ukuranPerProduk, warnaPerProduk, editId, defaultValues }: Props) {
  const router = useRouter();
  const { create, update } = useBomMutation();
  const [isCancelling, startCancel] = useTransition();
  const isEditing = !!editId;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BomInput>({
    resolver: zodResolver(bomSchema),
    defaultValues: defaultValues ?? {
      produkId: "",
      catatan: "",
      details: [EMPTY_ROW],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "details" });
  const [importOpen, setImportOpen] = useState(false);
  const details = watch("details");
  const produkId = watch("produkId");
  const ukuranOptions = (ukuranPerProduk[produkId] ?? []).map((u) => ({ label: u, value: u }));
  const warnaOptions = (warnaPerProduk[produkId] ?? []).map((w) => ({ label: w.nama, value: w.id }));

  // Produk diganti setelah baris terisi — buang ukuran/warna yang tak lagi berlaku,
  // jangan biarkan baris menyimpan pilihan milik produk lain (app-ut7f).
  const produkSebelumnya = useRef(produkId);
  useEffect(() => {
    if (produkSebelumnya.current === produkId) return;
    produkSebelumnya.current = produkId;
    const berlaku = new Set(ukuranPerProduk[produkId] ?? []);
    const warnaSah = new Set((warnaPerProduk[produkId] ?? []).map((w) => w.id));
    getValues("details")?.forEach((row, i) => {
      if (row.berlakuUkuran) {
        const sisa = row.berlakuUkuran
          .split(",")
          .map((u) => u.trim())
          .filter((u) => berlaku.has(u));
        if (sisa.length !== row.berlakuUkuran.split(",").filter(Boolean).length) {
          setValue(`details.${i}.berlakuUkuran`, sisa.join(","));
        }
      }
      const w = row.berlakuWarnaIds ?? [];
      const wSisa = w.filter((id) => warnaSah.has(id));
      if (wSisa.length !== w.length) setValue(`details.${i}.berlakuWarnaIds`, wSisa);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produkId]);

  // FK dropdown filter aktif — keep yang sedang terpilih (edit value existing)
  const produkChoices = produkOptions.filter(
    (p) => p.isActive || p.id === watch("produkId"),
  );
  const bahanChoices = (index: number) =>
    bahanOptions.filter(
      (b) => b.isActive || b.id === details?.[index]?.bahanId,
    );

  async function onSubmit(data: BomInput) {
    const res = isEditing
      ? await update.mutateAsync({ id: editId, input: data })
      : await create.mutateAsync(data);
    if (!res.error) router.push("/master/data-produk?tab=bom");
  }

  const isPending = create.isPending || update.isPending;

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header card */}
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="Produk"
            required
            placeholder="Pilih produk"
            options={produkChoices.map((p) => ({ label: `${p.kode} — ${p.nama}`, value: p.id }))}
            value={watch("produkId") || null}
            onChange={(v) => setValue("produkId", (v as string) ?? "", { shouldValidate: true })}
            error={errors.produkId}
            disabled={isEditing}
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
            Produk tidak bisa diganti saat edit — buat BOM baru untuk produk lain.
          </p>
        )}
      </div>

      {/* Detail bahan */}
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-dark dark:text-white">Kebutuhan Bahan per Pcs</h3>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!produkId}
              onClick={() => setImportOpen(true)}
            >
              <FileSpreadsheet size={16} className="mr-1.5" />
              Import Excel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!produkId}
              onClick={() => append(EMPTY_ROW)}
            >
              <Plus size={16} className="mr-1.5" />
              Tambah Baris
            </Button>
          </div>
        </div>
        <p className="mb-3 text-xs text-dark-5 dark:text-dark-6">
          Warna/Ukuran kosong = dipakai semua. Isi Warna untuk kain yang beda per warna produk.
        </p>

        {/* BOM itu resep milik satu produk — tanpa produk, baris bahan tak punya acuan
            (ukuran diambil dari variannya). Kunci dulu daripada membiarkan terisi separuh. */}
        {!produkId && (
          <p className="mb-3 text-xs text-dark-5 dark:text-dark-6">
            Pilih produk dulu di atas untuk mengisi kebutuhan bahan.
          </p>
        )}

        {typeof errors.details?.message === "string" && (
          <p className="mb-3 text-xs text-red-500">{errors.details.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => {
            const row = details?.[index];
            const bahanDipilih = bahanOptions.find((b) => b.id === row?.bahanId);
            const satuan = bahanDipilih?.satuanSingkatan;
            return (
              <div
                key={field.id}
                className="rounded-lg border border-stroke p-4 dark:border-dark-3 md:border-none md:p-0 md:border-b md:pb-3 md:last:border-none"
              >
                {/* Header item khusus mobile */}
                <div className="mb-3 flex items-center justify-between md:hidden">
                  <span className="text-xs font-semibold text-dark-5 dark:text-dark-6">
                    Bahan #{index + 1}
                  </span>
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

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2.5fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.5fr)_2.5rem] md:items-start">
                  <ComboSelect
                    label={index === 0 ? "Bahan" : undefined}
                    disabled={!produkId}
                    placeholder={produkId ? "Pilih bahan" : "Pilih produk dulu"}
                    options={bahanChoices(index).map((b) => ({
                      label: `${b.kode} — ${b.nama}${b.ukuran ? " · " + b.ukuran : ""}`,
                      value: b.id,
                    }))}
                    value={row?.bahanId || null}
                    onChange={(v) =>
                      setValue(`details.${index}.bahanId`, (v as string) ?? "", {
                        shouldValidate: true,
                      })
                    }
                    error={errors.details?.[index]?.bahanId}
                  />

                  <div>
                    {index === 0 && (
                      <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                        Warna
                      </label>
                    )}
                    <MultiSelect
                      options={warnaOptions}
                      disabled={!produkId}
                      placeholder={produkId ? "Semua" : "Pilih produk dulu"}
                      value={row?.berlakuWarnaIds ?? []}
                      onChange={(vals) =>
                        setValue(`details.${index}.berlakuWarnaIds`, vals, { shouldValidate: true })
                      }
                    />
                  </div>

                  <div>
                    {index === 0 && (
                      <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                        Ukuran
                      </label>
                    )}
                    <MultiSelect
                      options={ukuranOptions}
                      disabled={!produkId}
                      placeholder={produkId ? "Semua" : "Pilih produk dulu"}
                      value={row?.berlakuUkuran ? row.berlakuUkuran.split(",").filter(Boolean) : []}
                      onChange={(vals) =>
                        setValue(`details.${index}.berlakuUkuran`, vals.join(","), {
                          shouldValidate: true,
                        })
                      }
                    />
                    {errors.details?.[index]?.berlakuUkuran?.message && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.details[index]?.berlakuUkuran?.message}
                      </p>
                    )}
                  </div>

                  <NumberInput
                    decimals={3}
                    disabled={!produkId}
                    placeholder="0"
                    label={index === 0 ? "Kuantitas" : undefined}
                    icon={satuan ? <span className="text-xs">{satuan}</span> : undefined}
                    iconPosition="right"
                    value={watch(`details.${index}.kuantitas`)}
                    onChange={(v) =>
                      setValue(`details.${index}.kuantitas`, v as number, { shouldValidate: true })
                    }
                    error={errors.details?.[index]?.kuantitas?.message}
                  />

                  <Input
                    label={index === 0 ? "Keterangan" : undefined}
                    disabled={!produkId}
                    placeholder="Opsional"
                    {...register(`details.${index}.keterangan`)}
                    error={errors.details?.[index]?.keterangan?.message}
                  />

                  {/* Tombol hapus desktop */}
                  <div className="hidden md:block">
                    {index === 0 && <div className="mb-2 h-5" aria-hidden />}
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
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          loading={isCancelling}
          onClick={() => startCancel(() => router.push("/master/data-produk?tab=bom"))}
        >
          Batal
        </Button>
        <Button type="submit" loading={isPending}>
          {isEditing ? "Simpan Perubahan" : "Simpan (Draft)"}
        </Button>
      </div>
    </form>
    <ImportExcelModal
      open={importOpen}
      onClose={() => setImportOpen(false)}
      config={{
        title: "Import Bahan BOM",
        templateFilename: "template-bahan-bom",
        columns: BOM_IMPORT_COLUMNS.filter((c) => c.key !== "produk"),
        successMessage: (n) => `${n} baris masuk ke form — cek lalu Simpan`,
        action: async (rows) => {
          const res = await resolveBomImportRows(produkId, rows);
          if (!res.details) return res;
          const baru = res.details.map((d) => ({
            bahanId: d.bahanId,
            kuantitas: d.kuantitas,
            toleransiPersen: d.toleransiPersen,
            berlakuUkuran: d.berlakuUkuran ?? "",
            berlakuWarnaIds: d.berlakuWarnaIds ?? [],
            keterangan: d.keterangan ?? "",
          }));
          // baris form yang masih kosong (bahan belum dipilih) dibuang, sisanya dipertahankan
          const terisi = getValues("details").filter((r) => r.bahanId);
          replace([...terisi, ...baru]);
          return { inserted: baru.length };
        },
        onSuccess: () => setImportOpen(false),
      }}
    />
    </>
  );
}
