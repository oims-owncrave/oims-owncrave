"use client";

import { useForm, useFieldArray, type UseFormRegister, type UseFormSetValue, type FieldErrors } from "react-hook-form";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ComboSelect } from "@/components/ui/ComboSelect";
import {
  barangMasukSchema,
  type BarangMasukFormInput,
  type BarangMasukInput,
} from "@/lib/schemas/barang-masuk";
import { useBarangMasukMutation } from "@/hooks/useBarangMasuk";
import { useRiwayatHarga } from "@/hooks/useRiwayatHarga";

type BahanOption = {
  id: string;
  kode: string;
  nama: string;
  satuanSingkatan: string | null;
  isActive: boolean;
  hargaRataRata: string;
};
type SupplierOption = { id: string; nama: string; isActive: boolean };

interface Props {
  bahanOptions: BahanOption[];
  supplierOptions: SupplierOption[];
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
      className="rounded-lg border border-stroke p-4 dark:border-dark-3 md:border-none md:p-0 md:border-b md:pb-3 md:last:border-none"
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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_2.5rem]">
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

        <Input
          type="number"
          step="0.001"
          label={index === 0 ? `Kuantitas${satuan ? ` (${satuan})` : ""}` : undefined}
          {...register(`detail.${index}.kuantitas`, { valueAsNumber: true })}
          error={errors.detail?.[index]?.kuantitas?.message}
        />

        <div>
          <Input
            type="number"
            step="1"
            label={index === 0 ? "Harga Satuan" : undefined}
            {...register(`detail.${index}.hargaSatuan`, { valueAsNumber: true })}
            error={errors.detail?.[index]?.hargaSatuan?.message}
          />

          {/* Hint Riwayat Harga Pembelian */}
          {row?.bahanId && (riwayat.length > 0 || hargaRataRata > 0) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-dark-5 dark:text-dark-6">
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

        {/* Subtotal */}
        <div className="flex items-center justify-between border-t border-stroke/40 pt-2 dark:border-dark-3/40 md:block md:border-t-0 md:pt-0">
          <span className="text-xs text-dark-5 dark:text-dark-6 md:hidden">
            Subtotal:
          </span>
          <label className={`mb-2 hidden text-right text-sm font-medium text-dark dark:text-white md:block ${index === 0 ? "" : "invisible"}`}>
            Subtotal
          </label>
          <div className="flex h-10 items-center justify-end px-0 text-sm font-semibold text-dark dark:text-white md:px-4 md:font-medium">
            {rupiah(subtotal)}
          </div>
        </div>

        {/* Desktop Delete button */}
        <div className="hidden md:block">
          <div className={`mb-2 h-5 ${index === 0 ? "block" : "invisible"}`} aria-hidden />
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

export function BarangMasukForm({ bahanOptions, supplierOptions }: Props) {
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
      detail: [{ bahanId: "", kuantitas: 0, hargaSatuan: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "detail" });
  const detail = watch("detail");

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
              append({ bahanId: "", kuantitas: 0, hargaSatuan: 0 })
            }
          >
            <Plus size={16} className="mr-1.5" />
            Tambah Bahan
          </Button>
        </div>

        {typeof errors.detail?.message === "string" && (
          <p className="mb-3 text-xs text-red-500">{errors.detail.message}</p>
        )}

        <div className="space-y-3">
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
