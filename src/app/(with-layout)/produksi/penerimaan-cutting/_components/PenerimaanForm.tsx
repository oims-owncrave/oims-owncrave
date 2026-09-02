"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ComboSelect } from "@/components/ui/ComboSelect";
import {
  penerimaanSchema,
  type PenerimaanInput,
  KONDISI_TERIMA,
} from "@/lib/schemas/penerimaan-cutting";
import { usePenerimaanMutation, useBkPrefill } from "@/hooks/usePenerimaanCutting";
import type { BkSiapTerima } from "@/services/penerimaan-cutting";

interface Props {
  bkOptions: BkSiapTerima[];
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const fmtQty = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);

export function PenerimaanForm({ bkOptions }: Props) {
  const router = useRouter();
  const { create } = usePenerimaanMutation();
  const [isCancelling, startCancel] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PenerimaanInput>({
    resolver: zodResolver(penerimaanSchema),
    defaultValues: {
      barangKeluarId: "",
      tanggalTerima: todayISO(),
      catatan: "",
      details: [],
    },
  });

  const { replace } = useFieldArray({ control, name: "details" });
  const barangKeluarId = watch("barangKeluarId");
  const details = watch("details");

  const { data: prefill } = useBkPrefill(barangKeluarId || "");

  // BK dipilih → baris detail dari barang_keluar_detail (jumlah diterima default = gudang)
  useEffect(() => {
    if (prefill) {
      replace(
        prefill.map((p) => ({
          bahanId: p.bahanId,
          jumlahDiterima: Number(p.kuantitas),
          kondisi: "baik" as const,
          catatan: "",
        })),
      );
    } else {
      replace([]);
    }
  }, [prefill, replace]);

  const bkTerpilih = bkOptions.find((b) => b.id === barangKeluarId);

  async function onSubmit(data: PenerimaanInput) {
    const res = await create.mutateAsync(data);
    if (!res.error) router.push("/produksi/penerimaan-cutting");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="Barang Keluar"
            required
            placeholder="Pilih barang keluar (ber-permintaan bahan)"
            options={bkOptions.map((b) => ({
              label: `${b.nomorDokumen} · ${b.poNomor} — ${b.produkNama}`,
              value: b.id,
            }))}
            value={barangKeluarId || null}
            onChange={(v) => setValue("barangKeluarId", (v as string) ?? "", { shouldValidate: true })}
            error={errors.barangKeluarId}
          />
          <Input
            type="date"
            label="Tanggal Terima"
            required
            {...register("tanggalTerima")}
            error={errors.tanggalTerima?.message}
          />
          <Input
            label="Catatan"
            placeholder="Opsional"
            className="md:col-span-2"
            {...register("catatan")}
            error={errors.catatan?.message}
          />
        </div>
        {bkTerpilih && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Dari {bkTerpilih.pbNomor} · PO {bkTerpilih.poNomor}. Jumlah menurut gudang terkunci dari dokumen barang keluar.
          </p>
        )}
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-4 font-semibold text-dark dark:text-white">Bahan Diterima</h3>

        {!barangKeluarId && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Pilih barang keluar dulu.</p>
        )}
        {typeof errors.details?.message === "string" && (
          <p className="mb-3 text-xs text-red-500">{errors.details.message}</p>
        )}

        <div className="space-y-3">
          {(prefill ?? []).map((p, index) => {
            const row = details?.[index];
            const selisih = (Number(row?.jumlahDiterima) || 0) - Number(p.kuantitas);
            return (
              <div
                key={p.bahanId}
                className="rounded-lg border border-stroke p-4 dark:border-dark-3 md:border-none md:p-0 md:border-b md:pb-3 md:last:border-none"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.3fr)]">
                  <div>
                    {index === 0 && (
                      <label className="mb-2 block text-sm font-medium text-gray-700">Bahan</label>
                    )}
                    <div className="flex h-10 items-center text-sm font-medium text-dark dark:text-white">
                      {p.bahanKode} — {p.bahanNama}
                    </div>
                  </div>

                  <div>
                    {index === 0 && (
                      <label className="mb-2 block text-sm font-medium text-gray-700">Menurut Gudang</label>
                    )}
                    <div className="flex h-10 items-center text-sm text-dark dark:text-white">
                      {fmtQty(Number(p.kuantitas))} {p.satuanSingkatan}
                    </div>
                  </div>

                  <div>
                    <Input
                      type="number"
                      step="0.001"
                      label={index === 0 ? "Diterima" : undefined}
                      {...register(`details.${index}.jumlahDiterima`, { valueAsNumber: true })}
                      error={errors.details?.[index]?.jumlahDiterima?.message}
                    />
                    {selisih !== 0 && (
                      <p className="mt-1 text-[10px] font-medium text-yellow-700 dark:text-yellow-300">
                        Selisih: {selisih > 0 ? "+" : ""}{fmtQty(selisih)} {p.satuanSingkatan}
                      </p>
                    )}
                  </div>

                  <Select
                    label={index === 0 ? "Kondisi" : undefined}
                    options={KONDISI_TERIMA.map((k) => ({ value: k.value, label: k.label }))}
                    {...register(`details.${index}.kondisi`)}
                    error={errors.details?.[index]?.kondisi?.message}
                  />

                  <Input
                    label={index === 0 ? "Catatan" : undefined}
                    placeholder="Opsional"
                    {...register(`details.${index}.catatan`)}
                  />
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
          onClick={() => startCancel(() => router.push("/produksi/penerimaan-cutting"))}
        >
          Batal
        </Button>
        <Button type="submit" loading={create.isPending} disabled={!barangKeluarId}>
          Simpan Penerimaan
        </Button>
      </div>
    </form>
  );
}
