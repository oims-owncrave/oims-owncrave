"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ComboSelect } from "@/components/ui/ComboSelect";
import {
  penyesuaianSchema,
  type PenyesuaianFormInput,
  type PenyesuaianInput,
} from "@/lib/schemas/penyesuaian";
import { usePenyesuaianMutation } from "@/hooks/usePenyesuaian";

type BahanOption = {
  id: string;
  kode: string;
  nama: string;
  satuanSingkatan: string | null;
  stokKuantitas: string | null;
};

interface Props {
  bahanOptions: BahanOption[];
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function PenyesuaianForm({ bahanOptions }: Props) {
  const router = useRouter();
  const { request } = usePenyesuaianMutation();
  const [isCancelling, startCancel] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PenyesuaianFormInput>({
    resolver: zodResolver(penyesuaianSchema),
    defaultValues: {
      bahanId: "",
      kuantitasSetelah: 0,
      alasan: "",
      tanggal: todayISO(),
    },
  });

  const bahanId = watch("bahanId");
  const kuantitasSetelah = watch("kuantitasSetelah");

  const selectedBahan = bahanOptions.find((b) => b.id === bahanId);
  const stokSaatIni = Number(selectedBahan?.stokKuantitas ?? 0);
  const selisih = (Number(kuantitasSetelah) || 0) - stokSaatIni;

  async function onSubmit(data: PenyesuaianFormInput) {
    const res = await request.mutateAsync(data as PenyesuaianInput);
    if (!res.error) router.push("/inventory/penyesuaian");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Pilih Bahan */}
          <div className="md:col-span-2">
            <ComboSelect
              label="Bahan"
              required
              placeholder="Pilih bahan..."
              options={bahanOptions.map((b) => ({
                label: `${b.kode} — ${b.nama}`,
                value: b.id,
              }))}
              value={bahanId || null}
              onChange={(v) =>
                setValue("bahanId", (v as string) ?? "", { shouldValidate: true })
              }
              error={errors.bahanId}
            />
          </div>

          {/* Stok saat ini (read-only) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Stok Saat Ini
            </label>
            <div className="flex h-11 items-center rounded-lg border border-stroke bg-gray-100 px-4 text-sm text-dark-5 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6">
              {selectedBahan
                ? `${stokSaatIni.toLocaleString("id-ID", { maximumFractionDigits: 3 })} ${selectedBahan.satuanSingkatan || ""}`
                : "—"}
            </div>
          </div>

          {/* Kuantitas fisik (input) */}
          <Input
            type="number"
            step="0.001"
            label={`Kuantitas Fisik${selectedBahan?.satuanSingkatan ? ` (${selectedBahan.satuanSingkatan})` : ""}`}
            required
            {...register("kuantitasSetelah", { valueAsNumber: true })}
            error={errors.kuantitasSetelah?.message}
          />

          {/* Selisih (computed, read-only) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Selisih (auto)
            </label>
            <div
              className={`flex h-11 items-center rounded-lg border px-4 text-sm font-medium ${
                selisih > 0
                  ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300"
                  : selisih < 0
                  ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
                  : "border-stroke bg-gray-100 text-dark-5 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6"
              }`}
            >
              {selisih > 0 ? "+" : ""}
              {selisih.toLocaleString("id-ID", { maximumFractionDigits: 3 })}{" "}
              {selectedBahan?.satuanSingkatan || ""}
            </div>
          </div>

          {/* Tanggal */}
          <Input
            type="date"
            label="Tanggal"
            required
            {...register("tanggal")}
            error={errors.tanggal?.message}
          />

          {/* Alasan */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Alasan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan alasan penyesuaian stok..."
              {...register("alasan")}
              className={`w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm text-dark outline-none transition placeholder:text-dark-5 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-3 dark:bg-gray-dark dark:text-white dark:placeholder:text-dark-6 ${
                errors.alasan ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
              }`}
            />
            {errors.alasan && (
              <p className="mt-1 text-xs text-red-500">{errors.alasan.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          loading={isCancelling}
          onClick={() => startCancel(() => router.push("/inventory/penyesuaian"))}
        >
          Batal
        </Button>
        <Button type="submit" loading={request.isPending}>
          Ajukan Penyesuaian
        </Button>
      </div>
    </form>
  );
}
