"use client";

import { useEffect, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { formatRupiah } from "@/lib/utils";
import { returSchema, type ReturInput, PENANGGUNG_LABEL } from "@/lib/schemas/retur-jahit";
import { useReturMutation, useRusakBisaDiretur } from "@/hooks/useReturJahit";
import type { PenerimaanPunyaRusak } from "@/services/retur-jahit";

interface Props {
  penerimaanOptions: PenerimaanPunyaRusak[];
  initialPenerimaanId?: string;
  editId?: string;
  defaultValues?: ReturInput;
}

// Referensi stabil untuk dependency effect (alasan: lihat PenerimaanForm).
const KOSONG: never[] = [];

const todayISO = () => new Date().toISOString().slice(0, 10);

export function ReturForm({ penerimaanOptions, initialPenerimaanId = "", editId, defaultValues }: Props) {
  const router = useRouter();
  const { create, update } = useReturMutation();
  const [isCancelling, startCancel] = useTransition();
  const isEditing = !!editId;

  const awal = penerimaanOptions.find((p) => p.id === initialPenerimaanId);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReturInput>({
    resolver: zodResolver(returSchema),
    defaultValues: defaultValues ?? {
      penugasanId: awal?.penugasanId ?? "",
      penerimaanAsalId: initialPenerimaanId,
      tanggalRetur: todayISO(),
      targetKembali: "",
      alasan: "",
      catatan: "",
      details: [],
    },
  });

  const { fields, replace } = useFieldArray({ control, name: "details" });
  const details = watch("details");
  const penerimaanAsalId = watch("penerimaanAsalId");
  const { data: kandidat = KOSONG } = useRusakBisaDiretur(penerimaanAsalId);

  // baris = rusak yang belum diretur; saat edit, tambah kembali porsi retur ini
  useEffect(() => {
    if (kandidat.length === 0) return;
    const existing = new Map(details.map((d) => [d.penugasanDetailId, d]));
    replace(
      kandidat
        .map((k) => {
          const cur = existing.get(k.penugasanDetailId);
          const cap = k.sisaBisaDiretur + (isEditing ? cur?.jumlah ?? 0 : 0);
          if (cap <= 0 && !cur) return null;
          return cur ?? { penugasanDetailId: k.penugasanDetailId, jumlah: cap, jenisKerusakan: "", instruksi: "", tarifPerbaikan: 0, penanggungBiaya: "vendor" as const, fotoUrl: "" };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kandidat]);

  async function onSubmit(data: ReturInput) {
    const res = isEditing ? await update.mutateAsync({ id: editId, input: data }) : await create.mutateAsync(data);
    if (!res.error && res.data) router.push(`/vendor/retur/${res.data.id}`);
  }

  const isPending = create.isPending || update.isPending;
  const capOf = (id: string) => {
    const k = kandidat.find((x) => x.penugasanDetailId === id);
    if (!k) return null;
    const cur = defaultValues?.details.find((d) => d.penugasanDetailId === id);
    return { ...k, cap: k.sisaBisaDiretur + (isEditing ? cur?.jumlah ?? 0 : 0) };
  };
  const totalPcs = details.reduce((s, d) => s + (Number(d.jumlah) || 0), 0);
  const biayaOwncrave = details.reduce((s, d) => s + (d.penanggungBiaya === "owncrave" ? (Number(d.jumlah) || 0) * (Number(d.tarifPerbaikan) || 0) : 0), 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="Penerimaan asal (yang ada rusaknya)"
            required
            placeholder="Pilih penerimaan"
            options={penerimaanOptions.map((p) => ({ label: `${p.nomorDokumen} — ${p.pihakNama} (${p.penugasanNomor})`, value: p.id }))}
            value={penerimaanAsalId || null}
            onChange={(v) => {
              const id = (v as string) ?? "";
              setValue("penerimaanAsalId", id, { shouldValidate: true });
              setValue("penugasanId", penerimaanOptions.find((p) => p.id === id)?.penugasanId ?? "");
              replace([]);
            }}
            error={errors.penerimaanAsalId}
            disabled={isEditing}
          />
          <Input type="date" label="Tanggal Retur" required {...register("tanggalRetur")} error={errors.tanggalRetur?.message} />
          <Input type="date" label="Target Kembali" {...register("targetKembali")} />
          <Input label="Alasan" required placeholder="Misal: jahitan lepas, ukuran meleset" {...register("alasan")} error={errors.alasan?.message} />
          <Input label="Catatan" placeholder="Opsional" {...register("catatan")} />
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-dark dark:text-white">Barang yang Diretur</h3>
          <span className="text-sm text-dark-5 dark:text-dark-6">{totalPcs} pcs · biaya Owncrave {formatRupiah(biayaOwncrave)}</span>
        </div>
        {!penerimaanAsalId && <p className="text-sm text-gray-500 dark:text-gray-400">Pilih penerimaan asal dulu.</p>}
        {penerimaanAsalId && fields.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Semua rusak dari penerimaan ini sudah diretur.</p>}
        {typeof errors.details?.message === "string" && <p className="mb-3 text-xs text-red-500">{errors.details.message}</p>}

        {fields.length > 0 && (
          <div className="space-y-4">
            {fields.map((f, i) => {
              const k = capOf(details[i]?.penugasanDetailId);
              return (
                <div key={f.id} className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-dark dark:text-white">
                      {k?.bundelNomor} <span className="text-xs font-normal text-dark-5">{k?.sku} · {k?.warnaNama} / {k?.ukuran}</span>
                    </p>
                    <span className="text-xs text-dark-5 dark:text-dark-6">rusak {k?.jumlahRusak} · bisa diretur {k?.cap}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Input type="number" step="1" label="Jumlah" {...register(`details.${i}.jumlah`, { valueAsNumber: true })} error={errors.details?.[i]?.jumlah?.message} />
                    <Input label="Jenis Kerusakan" placeholder="Misal: jahitan lepas" {...register(`details.${i}.jenisKerusakan`)} />
                    <Select label="Penanggung Biaya" options={(["vendor", "owncrave"] as const).map((p) => ({ value: p, label: PENANGGUNG_LABEL[p] }))} {...register(`details.${i}.penanggungBiaya`)} />
                    <Input type="number" step="1" label="Tarif Perbaikan / pcs" {...register(`details.${i}.tarifPerbaikan`, { valueAsNumber: true })} disabled={details[i]?.penanggungBiaya === "vendor"} />
                    <Input className="md:col-span-3" label="Instruksi Perbaikan" placeholder="Apa yang harus diperbaiki" {...register(`details.${i}.instruksi`)} />
                    <Input label="URL Foto" placeholder="Opsional" {...register(`details.${i}.fotoUrl`)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" loading={isCancelling} onClick={() => startCancel(() => router.push(isEditing ? `/vendor/retur/${editId}` : "/vendor/retur"))}>Batal</Button>
        <Button type="submit" loading={isPending}>{isEditing ? "Simpan Perubahan" : "Simpan (Draft)"}</Button>
      </div>
    </form>
  );
}
