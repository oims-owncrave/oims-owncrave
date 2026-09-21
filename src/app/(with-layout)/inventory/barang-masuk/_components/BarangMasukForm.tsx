"use client";

import { useForm, useFieldArray, type UseFormRegister, type UseFormSetValue, type FieldErrors } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { ComboSelect } from "@/components/ui/ComboSelect";
import {
  barangMasukSchema,
  type BarangMasukFormInput,
  type BarangMasukInput,
} from "@/lib/schemas/barang-masuk";
import { useBarangMasukMutation } from "@/hooks/useBarangMasuk";
import { useRiwayatHarga } from "@/hooks/useRiwayatHarga";
import { getBahanBomAktif } from "@/services/bom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type BahanOption = {
  id: string;
  kode: string;
  nama: string;
  satuanSingkatan: string | null;
  isActive: boolean;
  hargaRataRata: string;
};
type SupplierOption = { id: string; nama: string; isActive: boolean };
type ProdukOption = { id: string; kode: string; nama: string; isActive: boolean };

interface Props {
  bahanOptions: BahanOption[];
  supplierOptions: SupplierOption[];
  produkOptions: ProdukOption[];
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface DetailRowProps {
  index: number;
  fieldId: string;
  row: BarangMasukFormInput["detail"][number] | undefined;
  activeBahan: BahanOption[];
  register: UseFormRegister<BarangMasukFormInput>;
  setValue: UseFormSetValue<BarangMasukFormInput>;
  errors: FieldErrors<BarangMasukFormInput>;
  canRemove: boolean;
  onRemove: () => void;
}

function DetailRow({
  index,
  fieldId,
  row,
  activeBahan,
  register,
  setValue,
  errors,
  canRemove,
  onRemove,
}: DetailRowProps) {
  const { data: riwayat = [] } = useRiwayatHarga(row?.bahanId);

  const subtotal =
    (Number(row?.kuantitas) || 0) * (Number(row?.hargaSatuan) || 0);
  const bahanDipilih = activeBahan.find((b) => b.id === row?.bahanId);
  const satuan = bahanDipilih?.satuanSingkatan;
  const hargaRataRata = bahanDipilih ? Number(bahanDipilih.hargaRataRata) : 0;

  return (
    <div
      key={fieldId}
      className="rounded-lg border border-stroke p-4 dark:border-dark-3 md:border-none md:p-0 md:border-b md:pb-1.5 md:last:border-none"
    >
      {/* Header Item khusus Mobile */}
      <div className="mb-3 flex items-center justify-between md:hidden">
        <span className="text-xs font-semibold text-dark-5 dark:text-dark-6">
          Item #{index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 disabled:opacity-30 transition-colors"
          title="Hapus item ini"
        >
          <Trash2 size={14} />
          <span>Hapus</span>
        </button>
      </div>

      {/* Grid content */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_2.5rem] md:items-start">
        <ComboSelect
          label={index === 0 ? "Bahan" : undefined}
          placeholder="Pilih bahan"
          options={activeBahan.map((b) => ({
            label: `${b.kode} — ${b.nama}`,
            value: b.id,
          }))}
          value={row?.bahanId || null}
          onChange={(v) => {
            const bahanId = (v as string) ?? "";
            setValue(`detail.${index}.bahanId`, bahanId, { shouldValidate: true });
            const pilihan = activeBahan.find((b) => b.id === bahanId);
            if (pilihan && Number(pilihan.hargaRataRata) > 0) {
              setValue(`detail.${index}.hargaSatuan`, Number(pilihan.hargaRataRata), {
                shouldValidate: true,
              });
            }
          }}
          error={errors.detail?.[index]?.bahanId}
        />

        <NumberInput
          decimals={3}
          placeholder="0"
          label={index === 0 ? "Kuantitas" : undefined}
          icon={satuan ? <span className="text-xs">{satuan}</span> : undefined}
          iconPosition="right"
          value={row?.kuantitas}
          onChange={(v) =>
            setValue(`detail.${index}.kuantitas`, v as number, { shouldValidate: true })
          }
          error={errors.detail?.[index]?.kuantitas?.message}
        />

        <div>
          <NumberInput
            placeholder="0"
            label={index === 0 ? "Harga Satuan" : undefined}
            value={row?.hargaSatuan}
            onChange={(v) =>
              setValue(`detail.${index}.hargaSatuan`, v as number, { shouldValidate: true })
            }
            error={errors.detail?.[index]?.hargaSatuan?.message}
          />

          {/* Hint Riwayat Harga Pembelian — menggantung di bawah input, tidak memesan ruang
              tetap supaya baris tanpa riwayat harga tidak menyisakan celah kosong.
              Subtotal tetap sejajar karena grid memakai md:items-start. */}
          <div className="mt-1">
          {row?.bahanId && (riwayat.length > 0 || hargaRataRata > 0) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-dark-5 dark:text-dark-6">
              {hargaRataRata > 0 && (
                <span className="text-dark-4 dark:text-dark-5">
                  Rata²: <span className="font-medium">{rupiah(hargaRataRata)}</span>
                </span>
              )}
              {riwayat[0] && (() => {
                const item = riwayat[0];
                const hargaNum = Number(item.hargaSatuan);
                const dateStr = new Date(item.tanggal).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                });
                return (
                  <>
                    {hargaRataRata > 0 && <span className="opacity-40">·</span>}
                    <span className="font-medium">Terakhir:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setValue(`detail.${index}.hargaSatuan`, hargaNum, {
                          shouldValidate: true,
                        })
                      }
                      className="rounded -translate-x-1 py-0.5 font-medium text-primary hover:bg-primary/10 transition-colors"
                      title="Klik untuk memakai harga ini"
                    >
                      {rupiah(hargaNum)} ({dateStr})
                    </button>
                  </>
                );
              })()}
            </div>
          )}
          </div>
        </div>

        {/* Subtotal */}
        <div className="flex items-center justify-between border-t border-stroke/40 pt-2 dark:border-dark-3/40 md:block md:border-t-0 md:pt-0">
          <span className="text-xs text-dark-5 dark:text-dark-6 md:hidden">
            Subtotal:
          </span>
          {index === 0 && (
            <div className="mb-2 hidden h-5 text-right text-sm font-medium text-dark dark:text-white md:block">
              Subtotal
            </div>
          )}
          <div className="flex h-10 items-center justify-end px-0 text-sm font-semibold text-dark dark:text-white md:px-4 md:font-medium">
            {rupiah(subtotal)}
          </div>
        </div>

        {/* Desktop Delete button */}
        <div className="hidden md:block">
          {index === 0 && <div className="mb-2 h-5" aria-hidden />}
          <div className="flex h-10 items-center justify-center">
            <button
              type="button"
              onClick={onRemove}
              disabled={!canRemove}
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
}

export function BarangMasukForm({ bahanOptions, supplierOptions, produkOptions }: Props) {
  const router = useRouter();
  const { create } = useBarangMasukMutation();
  const [isCancelling, startCancel] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BarangMasukFormInput>({
    resolver: zodResolver(barangMasukSchema),
    defaultValues: {
      supplierId: "",
      nomorInvoice: "",
      tanggal: todayISO(),
      catatan: "",
      detail: [{ bahanId: "", kuantitas: undefined, hargaSatuan: undefined }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "detail" });
  const detail = watch("detail");

  // ── Prefill bahan dari BOM aktif sebuah produk ──────────────────────────
  // Hanya daftar bahannya yang diisi; kuantitas & harga tetap manual sesuai nota
  // supplier, karena pembelian nyata jarang pas dengan hitungan BOM.
  const [produkId, setProdukId] = useState<string | null>(null);
  const [memuatBom, setMemuatBom] = useState(false);
  const [konfirmasiTimpa, setKonfirmasiTimpa] = useState<string | null>(null);

  const adaIsian = (detail ?? []).some(
    (d) => d.bahanId || Number(d.kuantitas) > 0 || Number(d.hargaSatuan) > 0,
  );

  async function isiDariBom(id: string) {
    setMemuatBom(true);
    try {
      const res = await getBahanBomAktif(id);
      if ("error" in res) return toast.error(res.error);
      if (!res.data.length) return toast.error("BOM aktif produk ini belum punya bahan");
      setValue(
        "detail",
        res.data.map((b) => ({
          bahanId: b.bahanId,
          kuantitas: undefined,
          hargaSatuan: Number(b.hargaRataRata) || undefined,
        })),
        { shouldValidate: false },
      );
      setProdukId(id);
      toast.success(`${res.data.length} bahan dimuat dari BOM — isi kuantitas yang dibeli`);
    } finally {
      setMemuatBom(false);
    }
  }

  function pilihProduk(id: string | null) {
    if (!id) return setProdukId(null);
    if (adaIsian) return setKonfirmasiTimpa(id); // jangan diam-diam menimpa isian
    void isiDariBom(id);
  }

  const total = (detail ?? []).reduce(
    (sum, d) => sum + (Number(d.kuantitas) || 0) * (Number(d.hargaSatuan) || 0),
    0,
  );

  async function onSubmit(raw: BarangMasukFormInput) {
    const res = await create.mutateAsync(raw as unknown as BarangMasukInput);
    if (!res.error) router.push("/inventory/barang-masuk");
  }

  const activeSupplier = supplierOptions.filter((s) => s.isActive);
  const activeBahan = bahanOptions.filter((b) => b.isActive);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header card */}
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="Supplier"
            placeholder="Pilih supplier (opsional)"
            options={activeSupplier.map((s) => ({ label: s.nama, value: s.id }))}
            value={watch("supplierId") || null}
            onChange={(v) => setValue("supplierId", (v as string) ?? "")}
            error={errors.supplierId}
          />
          <Input
            label="Nomor Invoice"
            placeholder="Opsional"
            {...register("nomorInvoice")}
            error={errors.nomorInvoice?.message}
          />
          <Input
            type="date"
            label="Tanggal"
            required
            {...register("tanggal")}
            error={errors.tanggal?.message}
          />
          <Input
            label="Catatan"
            placeholder="Opsional"
            {...register("catatan")}
            error={errors.catatan?.message}
          />
        </div>

        {/* Jalan pintas: muat daftar bahan dari BOM aktif sebuah produk */}
        <div className="mt-4 border-t border-stroke pt-4 dark:border-dark-3">
          <div className="md:w-1/2">
            <ComboSelect
              label="Isi bahan dari produk (opsional)"
              placeholder={memuatBom ? "Memuat..." : "Pilih produk"}
              clearable
              options={produkOptions
                .filter((p) => p.isActive)
                .map((p) => ({ label: `${p.kode} — ${p.nama}`, value: p.id }))}
              value={produkId}
              onChange={(v) => pilihProduk((v as string) ?? null)}
              disabled={memuatBom}
            />
            <p className="mt-1.5 text-xs text-dark-5 dark:text-dark-6">
              Memuat semua bahan resep produk. Kuantitas tetap diisi manual sesuai nota supplier.
            </p>
          </div>
        </div>
      </div>

      {/* Detail bahan */}
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-dark dark:text-white">
            Detail Bahan
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ bahanId: "", kuantitas: undefined, hargaSatuan: undefined })
            }
          >
            <Plus size={16} className="mr-1.5" />
            Tambah Bahan
          </Button>
        </div>

        {typeof errors.detail?.message === "string" && (
          <p className="mb-3 text-xs text-red-500">{errors.detail.message}</p>
        )}

        <div className="space-y-3 md:space-y-1">
          {fields.map((field, i) => (
            <DetailRow
              key={field.id}
              index={i}
              fieldId={field.id}
              row={detail?.[i]}
              activeBahan={activeBahan}
              register={register}
              setValue={setValue}
              errors={errors}
              canRemove={fields.length > 1}
              onRemove={() => fields.length > 1 && remove(i)}
            />
          ))}
        </div>

        <div className="mt-4 flex justify-end border-t border-stroke pt-4 dark:border-dark-3">
          <div className="text-right">
            <span className="text-sm text-dark-5 dark:text-dark-6">Total</span>
            <p className="text-lg font-bold text-dark dark:text-white">
              {rupiah(total)}
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={konfirmasiTimpa !== null}
        title="Ganti isian dengan bahan dari produk?"
        message="Baris bahan yang sudah terisi akan diganti dengan resep produk yang dipilih."
        confirmLabel="Ganti"
        onConfirm={() => {
          const id = konfirmasiTimpa;
          setKonfirmasiTimpa(null);
          if (id) void isiDariBom(id);
        }}
        onCancel={() => setKonfirmasiTimpa(null)}
      />

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          loading={isCancelling}
          onClick={() => startCancel(() => router.push("/inventory/barang-masuk"))}
        >
          Batal
        </Button>
        <Button type="submit" loading={create.isPending}>
          Simpan
        </Button>
      </div>
    </form>
  );
}
