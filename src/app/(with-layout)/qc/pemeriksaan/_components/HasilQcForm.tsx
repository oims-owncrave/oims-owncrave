"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { Button } from "@/components/ui/Button";
import { hasilQcFormSchema, type HasilQcInput, type HasilQcFormValues } from "@/lib/schemas/hasil-qc";
import { cn } from "@/lib/utils";
import type { getWoQcDetail } from "@/services/wo-qc";
import { useHasilQcMutation } from "@/hooks/useHasilQc";

type WoData = NonNullable<Awaited<ReturnType<typeof getWoQcDetail>>>;
type UserOpt = { id: string; displayName: string; isActive: boolean };

interface Props {
  wo: WoData["header"];
  baris: WoData["details"];
  userOptions: UserOpt[];
}

type Angka = {
  jumlahDiperiksa: number;
  gradeA: number;
  gradeB: number;
  gradeC: number;
  perbaikan: number;
  reject: number;
};

const NOL: Angka = {
  jumlahDiperiksa: 0,
  gradeA: 0,
  gradeB: 0,
  gradeC: 0,
  perbaikan: 0,
  reject: 0,
};

const KOLOM: { key: keyof Omit<Angka, "jumlahDiperiksa">; label: string }[] = [
  { key: "gradeA", label: "Grade A" },
  { key: "gradeB", label: "Grade B" },
  { key: "gradeC", label: "Grade C" },
  { key: "perbaikan", label: "Perbaikan" },
  { key: "reject", label: "Reject" },
];

export function HasilQcForm({ wo, baris, userOptions }: Props) {
  const router = useRouter();
  const { create } = useHasilQcMutation();
  const [isCancelling, startCancel] = useTransition();

  const [angka, setAngka] = useState<Record<string, Angka>>(() =>
    Object.fromEntries(baris.map((b) => [b.id, { ...NOL }])),
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HasilQcFormValues>({
    resolver: zodResolver(hasilQcFormSchema),
    defaultValues: {
      workOrderQcId: wo.id,
      tanggal: new Date().toISOString().slice(0, 10),
      petugasId: null,
      catatan: "",
    },
  });

  const isPending = create.isPending;
  const petugasId = watch("petugasId");

  const userChoices = userOptions
    .filter((u) => u.isActive || u.id === petugasId)
    .map((u) => ({ value: u.id, label: u.displayName }));

  function setNilai(id: string, key: keyof Angka, v: number) {
    setAngka((prev) => {
      const row = { ...prev[id], [key]: Math.max(0, v) };
      // jumlah diperiksa selalu = Σ rincian; operator isi rinciannya saja
      if (key !== "jumlahDiperiksa") {
        row.jumlahDiperiksa =
          row.gradeA + row.gradeB + row.gradeC + row.perbaikan + row.reject;
      }
      return { ...prev, [id]: row };
    });
  }

  const rowsTerisi = baris.filter((b) => (angka[b.id]?.jumlahDiperiksa ?? 0) > 0);
  const totalDiperiksa = rowsTerisi.reduce((n, b) => n + angka[b.id].jumlahDiperiksa, 0);
  const totalBermasalah = rowsTerisi.reduce(
    (n, b) =>
      n + angka[b.id].gradeB + angka[b.id].gradeC + angka[b.id].perbaikan + angka[b.id].reject,
    0,
  );
  const defectRate = totalDiperiksa > 0 ? (totalBermasalah / totalDiperiksa) * 100 : 0;

  // baris yang melebihi sisa — dicegah sebelum submit, tapi server tetap cek ulang
  const kelebihan = baris.filter(
    (b) => (angka[b.id]?.jumlahDiperiksa ?? 0) > b.belumDiperiksa,
  );

  async function onSubmit(data: HasilQcFormValues) {
    const details = rowsTerisi.map((b) => ({
      workOrderQcDetailId: b.id,
      varianId: b.varianId,
      ...angka[b.id],
      catatan: null,
    }));

    if (details.length === 0) return;

    const res = await create.mutateAsync({ ...data, details } as HasilQcInput);
    if (!res.error) router.push("/qc/pemeriksaan");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Tanggal"
            type="date"
            error={errors.tanggal?.message}
            {...register("tanggal")}
            disabled={isPending}
          />
          <ComboSelect
            label="Petugas QC"
            options={userChoices}
            value={petugasId ?? null}
            onChange={(v) => setValue("petugasId", (v as string) || null)}
            placeholder={wo.picNama ? `Default: ${wo.picNama}` : "Pilih petugas"}
            disabled={isPending}
          />
          <div>
            <span className="text-xs uppercase text-gray-500 dark:text-gray-400">
              Standar (snapshot)
            </span>
            <p className="mt-1 text-sm text-dark dark:text-white">
              {wo.standarNomor ? `${wo.standarNama} (v${wo.standarVersi})` : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h3 className="font-semibold text-dark dark:text-white">Hasil per Varian</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {totalDiperiksa} pcs diperiksa · defect rate{" "}
            <strong
              className={cn(
                defectRate >= 20
                  ? "text-red-600"
                  : defectRate >= 10
                    ? "text-amber-600"
                    : "text-green-600",
              )}
            >
              {defectRate.toFixed(1)}%
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-2">
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Produk / SKU</th>
                <th className="px-4 py-3">Warna / Ukuran</th>
                <th className="px-4 py-3 text-right">Belum Diperiksa</th>
                {KOLOM.map((k) => (
                  <th key={k.key} className="px-3 py-3 text-right w-24">
                    {k.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => {
                const a = angka[b.id] ?? NOL;
                const lebih = a.jumlahDiperiksa > b.belumDiperiksa;
                return (
                  <tr key={b.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-4 py-3">
                      <div className="text-dark dark:text-white">{b.produkNama}</div>
                      <div className="text-xs text-gray-500">{b.sku}</div>
                    </td>
                    <td className="px-4 py-3">
                      {b.warnaNama} / {b.ukuran}
                    </td>
                    <td className="px-4 py-3 text-right">{b.belumDiperiksa}</td>
                    {KOLOM.map((k) => (
                      <td key={k.key} className="px-3 py-3">
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={a[k.key] || ""}
                          onChange={(e) => setNilai(b.id, k.key, Number(e.target.value) || 0)}
                          disabled={isPending || b.belumDiperiksa === 0}
                          className="w-full rounded-md border border-stroke bg-transparent px-2 py-1 text-right outline-hidden focus:border-primary disabled:opacity-50 dark:border-dark-3 dark:text-white"
                        />
                      </td>
                    ))}
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold",
                        lebih ? "text-red-600" : "text-dark dark:text-white",
                      )}
                    >
                      {a.jumlahDiperiksa}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {kelebihan.length > 0 && (
          <p className="border-t border-stroke px-6 py-3 text-sm text-red-600 dark:border-dark-3">
            Ada baris yang melebihi sisa belum diperiksa — perbaiki dulu sebelum menyimpan.
          </p>
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
          onClick={() => startCancel(() => router.push("/qc/pemeriksaan"))}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button
          type="submit"
          loading={isPending}
          disabled={rowsTerisi.length === 0 || kelebihan.length > 0}
        >
          {isPending ? "Menyimpan..." : "Simpan Hasil QC"}
        </Button>
      </div>
    </form>
  );
}
