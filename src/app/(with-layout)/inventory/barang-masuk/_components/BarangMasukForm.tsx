"use client";

import { useForm, useFieldArray } from "react-hook-form";
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

type BahanOption = {
  id: string;
  kode: string;
  nama: string;
  satuanSingkatan: string | null;
  isActive: boolean;
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
    // resolver sudah coerce ke number; cast ke output type untuk Server Action
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
          {fields.map((field, i) => {
            const row = detail?.[i];
            const subtotal =
              (Number(row?.kuantitas) || 0) * (Number(row?.hargaSatuan) || 0);
            const satuan = activeBahan.find(
              (b) => b.id === row?.bahanId,
            )?.satuanSingkatan;

            return (
              <div
                key={field.id}
                className="grid grid-cols-1 items-end gap-3 border-b border-stroke pb-3 last:border-none dark:border-dark-3 md:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_2.5rem]"
              >
                <ComboSelect
                  label={i === 0 ? "Bahan" : undefined}
                  placeholder="Pilih bahan"
                  options={activeBahan.map((b) => ({
                    label: `${b.kode} — ${b.nama}`,
                    value: b.id,
                  }))}
                  value={row?.bahanId || null}
                  onChange={(v) =>
                    setValue(`detail.${i}.bahanId`, (v as string) ?? "", {
                      shouldValidate: true,
                    })
                  }
                  error={errors.detail?.[i]?.bahanId}
                />
                <Input
                  type="number"
                  step="0.001"
                  label={i === 0 ? `Kuantitas${satuan ? ` (${satuan})` : ""}` : undefined}
                  {...register(`detail.${i}.kuantitas`)}
                  error={errors.detail?.[i]?.kuantitas?.message}
                />
                <Input
                  type="number"
                  step="1"
                  label={i === 0 ? "Harga Satuan" : undefined}
                  {...register(`detail.${i}.hargaSatuan`)}
                  error={errors.detail?.[i]?.hargaSatuan?.message}
                />
                {/* Subtotal — right-aligned, baseline dengan input (h-11 match Input) */}
                <div className="flex items-center justify-end py-2.5 text-sm">
                  <span className="text-sm font-medium text-dark dark:text-white">
                    {rupiah(subtotal)}
                  </span>
                </div>
                {/* Delete — align dengan input row */}
                <div className="flex items-center justify-center py-1">
                  <button
                    type="button"
                    onClick={() => fields.length > 1 && remove(i)}
                    disabled={fields.length === 1}
                    className="rounded p-2 text-dark-5 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent dark:text-dark-6 dark:hover:bg-red-500/10"
                    title="Hapus baris"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
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
