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
  barangKeluarSchema,
  type BarangKeluarFormInput,
  type BarangKeluarInput,
} from "@/lib/schemas/barang-keluar";
import { useBarangKeluarMutation } from "@/hooks/useBarangKeluar";

type BahanOption = {
  id: string;
  kode: string;
  nama: string;
  satuanSingkatan: string | null;
  hargaRataRata: string;
  kuantitasStok: string;
  isActive: boolean;
};

interface Props {
  bahanOptions: BahanOption[];
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

export function BarangKeluarForm({ bahanOptions }: Props) {
  const router = useRouter();
  const { create } = useBarangKeluarMutation();
  const [isCancelling, startCancel] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BarangKeluarFormInput>({
    resolver: zodResolver(barangKeluarSchema),
    defaultValues: {
      tujuan: "",
      tanggal: todayISO(),
      catatan: "",
      detail: [{ bahanId: "", kuantitas: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "detail" });
  const detail = watch("detail");

  const total = (detail ?? []).reduce((sum, d) => {
    const bahan = bahanOptions.find((b) => b.id === d.bahanId);
    const harga = Number(bahan?.hargaRataRata ?? 0);
    return sum + (Number(d.kuantitas) || 0) * harga;
  }, 0);

  async function onSubmit(raw: BarangKeluarFormInput) {
    const res = await create.mutateAsync(raw as unknown as BarangKeluarInput);
    if (!res.error) router.push("/inventory/barang-keluar");
  }

  const activeBahan = bahanOptions.filter((b) => b.isActive);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header card */}
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Tujuan"
            placeholder="Misal: Produksi PO-001"
            {...register("tujuan")}
            error={errors.tujuan?.message}
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
            className="md:col-span-2"
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
            onClick={() => append({ bahanId: "", kuantitas: 0 })}
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
            const bahanInfo = activeBahan.find((b) => b.id === row?.bahanId);
            const harga = Number(bahanInfo?.hargaRataRata ?? 0);
            const subtotal = (Number(row?.kuantitas) || 0) * harga;
            const satuan = bahanInfo?.satuanSingkatan;
            const stokTersedia = bahanInfo?.kuantitasStok;

            return (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-3 border-b border-stroke pb-3 last:border-none dark:border-dark-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)_2.5rem]"
              >
                <div>
                  <ComboSelect
                    label={i === 0 ? "Bahan" : undefined}
                    placeholder="Pilih bahan"
                    options={activeBahan.map((b) => ({
                      label: `${b.kode} — ${b.nama} (Stok: ${Number(b.kuantitasStok)} ${b.satuanSingkatan || ""})`,
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
                </div>
                <Input
                  type="number"
                  step="0.001"
                  label={
                    i === 0 ? `Kuantitas${satuan ? ` (${satuan})` : ""}` : undefined
                  }
                  {...register(`detail.${i}.kuantitas`, { valueAsNumber: true })}
                  error={errors.detail?.[i]?.kuantitas?.message}
                />
                
                {/* Harga Rata2 (Info) — label placeholder agar selalu sejajar */}
                <div>
                  <label className={`mb-2 block text-sm font-medium text-dark dark:text-white ${i === 0 ? "" : "invisible"}`}>
                    Harga Rata²
                  </label>
                  <div className="flex h-11 items-center px-4 rounded-lg border border-stroke bg-gray-100 text-sm text-dark-5 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6">
                    {bahanInfo ? rupiah(harga) : "-"}
                  </div>
                </div>

                {/* Subtotal — label placeholder agar selalu sejajar */}
                <div>
                  <label className={`mb-2 block text-right text-sm font-medium text-dark dark:text-white ${i === 0 ? "" : "invisible"}`}>
                    Subtotal
                  </label>
                  <div className="flex h-11 items-center justify-end px-4 text-sm font-medium text-dark dark:text-white">
                    {rupiah(subtotal)}
                  </div>
                </div>

                {/* Delete — label placeholder agar tombol sejajar dengan input */}
                <div>
                  <div className={`mb-2 h-5 ${i === 0 ? "block" : "invisible"}`} aria-hidden />
                  <div className="flex h-11 items-center justify-center">
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
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end border-t border-stroke pt-4 dark:border-dark-3">
          <div className="text-right">
            <span className="text-sm text-dark-5 dark:text-dark-6">Total Nilai Keluar</span>
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
          onClick={() => startCancel(() => router.push("/inventory/barang-keluar"))}
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
