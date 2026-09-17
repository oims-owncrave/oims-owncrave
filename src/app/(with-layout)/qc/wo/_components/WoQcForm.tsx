"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { woQcFormSchema, type WoQcInput, type WoQcFormValues } from "@/lib/schemas/wo-qc";
import { QC_PRIORITAS_LABEL, type QcPrioritas } from "@/lib/qc/prioritas";
import { cn, formatTanggal } from "@/lib/utils";
import type { BarisSiapWoRow } from "@/services/wo-qc";
import type { StandarQcRow } from "@/services/standar-qc";
import { useWoQcMutation } from "@/hooks/useWoQc";

type UserOpt = { id: string; displayName: string; isActive: boolean };

interface Props {
  baris: BarisSiapWoRow[];
  standarOptions: StandarQcRow[];
  userOptions: UserOpt[];
}

const METODE_OPTIONS = [
  { value: "seratus_persen", label: "Pemeriksaan 100%" },
  { value: "sampling", label: "Sampling" },
];

export function WoQcForm({ baris, standarOptions, userOptions }: Props) {
  const router = useRouter();
  const { create } = useWoQcMutation();
  const [isCancelling, startCancel] = useTransition();
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WoQcFormValues>({
    resolver: zodResolver(woQcFormSchema),
    defaultValues: {
      tanggal: new Date().toISOString().slice(0, 10),
      targetSelesai: "",
      picId: null,
      supervisorId: null,
      metode: "seratus_persen",
      standarQcId: null,
      populasi: 0,
      jumlahSampel: 0,
      batasDiterima: 0,
      batasDitolak: 0,
      alasanSampling: "",
      catatan: "",
    },
  });

  const isPending = create.isPending;
  const metode = watch("metode");
  const standarQcId = watch("standarQcId");
  const picId = watch("picId");
  const supervisorId = watch("supervisorId");

  const barisTerpilih = baris.filter((b) => dipilih.has(b.penerimaanQcDetailId));
  const totalPcs = barisTerpilih.reduce((n, b) => n + b.jumlahPcs, 0);

  // hanya standar AKTIF yang boleh jadi acuan WO baru
  const standarChoices = useMemo(
    () =>
      standarOptions
        .filter((s) => s.status === "aktif" || s.id === standarQcId)
        .map((s) => ({
          value: s.id,
          label: `${s.nomorDokumen} — ${s.nama} (v${s.versi})`,
        })),
    [standarOptions, standarQcId],
  );

  const userChoices = (current: string | null | undefined) =>
    userOptions
      .filter((u) => u.isActive || u.id === current)
      .map((u) => ({ value: u.id, label: u.displayName }));

  function toggle(id: string) {
    setDipilih((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(data: WoQcFormValues) {
    const details = barisTerpilih.map((b) => ({
      penerimaanQcDetailId: b.penerimaanQcDetailId,
      varianId: b.varianId,
      jumlahPcs: b.jumlahPcs,
    }));

    if (details.length === 0) return;

    const res = await create.mutateAsync({ ...data, details } as WoQcInput);
    if (!res.error) router.push("/qc/wo");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-4 font-semibold text-dark dark:text-white">Informasi Work Order</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Tanggal"
            type="date"
            error={errors.tanggal?.message}
            {...register("tanggal")}
            disabled={isPending}
          />
          <Input
            label="Target Selesai"
            type="date"
            {...register("targetSelesai")}
            disabled={isPending}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ComboSelect
            label="PIC Pemeriksa"
            options={userChoices(picId)}
            value={picId ?? null}
            onChange={(v) => setValue("picId", (v as string) || null)}
            placeholder="Pilih PIC"
            disabled={isPending}
          />
          <ComboSelect
            label="Supervisor"
            options={userChoices(supervisorId)}
            value={supervisorId ?? null}
            onChange={(v) => setValue("supervisorId", (v as string) || null)}
            placeholder="Pilih supervisor"
            disabled={isPending}
          />
        </div>

        <div className="mt-4">
          <ComboSelect
            label="Standar QC"
            options={standarChoices}
            value={standarQcId ?? null}
            onChange={(v) => setValue("standarQcId", (v as string) || null)}
            placeholder="Pilih standar aktif"
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Versi standar disimpan sebagai snapshot — hasil QC lama tetap terbaca walau
            standar naik versi.
          </p>
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-4 font-semibold text-dark dark:text-white">Metode Pemeriksaan</h3>

        <Select
          label="Metode"
          options={METODE_OPTIONS}
          error={errors.metode?.message}
          {...register("metode")}
          disabled={isPending}
        />

        {metode === "sampling" ? (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <NumberInput
                decimals={0}
                placeholder="0"
                label="Populasi"
                value={watch("populasi")}
                onChange={(v) =>
                  setValue("populasi", v as number, { shouldValidate: true })
                }
                disabled={isPending}
              />
              <NumberInput
                decimals={0}
                placeholder="0"
                label="Jumlah Sampel"
                error={errors.jumlahSampel?.message}
                value={watch("jumlahSampel")}
                onChange={(v) =>
                  setValue("jumlahSampel", v as number, { shouldValidate: true })
                }
                disabled={isPending}
              />
              <NumberInput
                decimals={0}
                placeholder="0"
                label="Batas Diterima"
                value={watch("batasDiterima")}
                onChange={(v) =>
                  setValue("batasDiterima", v as number, { shouldValidate: true })
                }
                disabled={isPending}
              />
              <NumberInput
                decimals={0}
                placeholder="0"
                label="Batas Ditolak"
                value={watch("batasDitolak")}
                onChange={(v) =>
                  setValue("batasDitolak", v as number, { shouldValidate: true })
                }
                disabled={isPending}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Alasan Sampling"
                placeholder="Misal: produk berulang, risiko rendah"
                {...register("alasanSampling")}
                disabled={isPending}
              />
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Pemeriksaan 100% — jumlah sampel otomatis sama dengan total pcs terpilih.
          </p>
        )}
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h3 className="font-semibold text-dark dark:text-white">
            Pilih Barang dari Antrean QC
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {barisTerpilih.length} baris · <strong>{totalPcs} pcs</strong>
          </span>
        </div>

        {baris.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Tidak ada barang siap di-WO. Terima dulu barang ke QC lewat menu Antrean QC.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-2">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 w-12"></th>
                  <th className="px-4 py-3">IN-QC</th>
                  <th className="px-4 py-3">PO</th>
                  <th className="px-4 py-3">Bundel</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Warna / Ukuran</th>
                  <th className="px-4 py-3">Prioritas</th>
                  <th className="px-4 py-3">Masuk</th>
                  <th className="px-4 py-3 text-right">Pcs</th>
                </tr>
              </thead>
              <tbody>
                {baris.map((b) => {
                  const p = QC_PRIORITAS_LABEL[b.prioritas as QcPrioritas];
                  return (
                    <tr
                      key={b.penerimaanQcDetailId}
                      className="border-t border-stroke dark:border-dark-3"
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={dipilih.has(b.penerimaanQcDetailId)}
                          onChange={() => toggle(b.penerimaanQcDetailId)}
                          disabled={isPending}
                        />
                      </td>
                      <td className="px-4 py-3">{b.nomorInQc}</td>
                      <td className="px-4 py-3">{b.nomorPo || "—"}</td>
                      <td className="px-4 py-3">{b.bundelNomor}</td>
                      <td className="px-4 py-3">{b.produkNama}</td>
                      <td className="px-4 py-3">{b.sku}</td>
                      <td className="px-4 py-3">
                        {b.warnaNama} / {b.ukuran}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            p?.className,
                          )}
                        >
                          {p?.label ?? b.prioritas}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatTanggal(b.tanggalMasuk)}</td>
                      <td className="px-4 py-3 text-right font-medium">{b.jumlahPcs}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <Input
          label="Catatan"
          placeholder="Opsional"
          {...register("catatan")}
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          loading={isCancelling}
          onClick={() => startCancel(() => router.push("/qc/wo"))}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button type="submit" loading={isPending} disabled={barisTerpilih.length === 0}>
          {isPending ? "Menyimpan..." : "Buat Work Order"}
        </Button>
      </div>
    </form>
  );
}
