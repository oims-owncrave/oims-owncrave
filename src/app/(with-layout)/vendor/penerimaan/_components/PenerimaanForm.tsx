"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { penerimaanHasilSchema, type PenerimaanHasilInput } from "@/lib/schemas/penerimaan-hasil-jahit";
import { usePenerimaanHasilMutation, useRekapPenugasan, useSisaRetur } from "@/hooks/usePenerimaanHasilJahit";
import type { PenugasanBisaTerima, ReturMenungguKembali } from "@/services/penerimaan-hasil-jahit";
import type { LokasiRow } from "../../lokasi/_components/LokasiTable";

interface Props {
  penugasanOptions: PenugasanBisaTerima[];
  returOptions: ReturMenungguKembali[];
  lokasiList: LokasiRow[];
  initialPenugasanId?: string;
  initialReturId?: string;
}

const nowLocalISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

type BarisCap = { penugasanDetailId: string; bundelNomor: string; sku: string; warnaNama: string; ukuran: string; cap: number; info: string };

export function PenerimaanForm({ penugasanOptions, returOptions, lokasiList, initialPenugasanId = "", initialReturId = "" }: Props) {
  const router = useRouter();
  const { create } = usePenerimaanHasilMutation();
  const [isCancelling, startCancel] = useTransition();

  const returAwal = returOptions.find((r) => r.id === initialReturId);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PenerimaanHasilInput>({
    resolver: zodResolver(penerimaanHasilSchema),
    defaultValues: {
      penugasanId: returAwal?.penugasanId ?? initialPenugasanId,
      returId: initialReturId || null,
      tanggalJam: nowLocalISO(),
      penerima: "",
      lokasiId: lokasiList.find((l) => l.jenis === "workshop_internal" && l.isActive)?.id ?? null,
      tanggalKirimVendor: "",
      pengirimVendor: "",
      kurirResi: "",
      buktiUrl: "",
      catatan: "",
      details: [],
    },
  });

  const { fields, replace } = useFieldArray({ control, name: "details" });
  const details = watch("details");
  const penugasanId = watch("penugasanId");
  const returId = watch("returId");
  const modeRetur = !!returId;

  const { data: rekap = [] } = useRekapPenugasan(modeRetur ? "" : penugasanId);
  const { data: sisaRetur = [] } = useSisaRetur(returId ?? "");

  // baris + cap per bundel — retur: jumlah retur − sudah kembali; setoran: pcs − (baik+rusak) kembali
  const baris: BarisCap[] = useMemo(
    () =>
      modeRetur
        ? sisaRetur.map((r) => ({
            penugasanDetailId: r.penugasanDetailId,
            bundelNomor: r.bundelNomor,
            sku: r.sku,
            warnaNama: r.warnaNama,
            ukuran: r.ukuran,
            cap: r.jumlahRetur - r.sudahKembali,
            info: `retur ${r.jumlahRetur} · kembali ${r.sudahKembali}`,
          }))
        : rekap.map((r) => ({
            penugasanDetailId: r.penugasanDetailId,
            bundelNomor: r.bundelNomor,
            sku: r.sku,
            warnaNama: r.warnaNama,
            ukuran: r.ukuran,
            cap: r.dikirim ? r.jumlahPcs - r.baik - r.rusak : 0,
            info: r.dikirim ? `dikirim ${r.jumlahPcs} · baik ${r.baik} · rusak ${r.rusak}` : "belum dikirim",
          })),
    [modeRetur, sisaRetur, rekap],
  );

  useEffect(() => {
    replace(baris.filter((b) => b.cap > 0).map((b) => ({ penugasanDetailId: b.penugasanDetailId, jumlahBaik: 0, jumlahRusak: 0, catatan: "" })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baris]);

  async function onSubmit(data: PenerimaanHasilInput) {
    const res = await create.mutateAsync(data);
    if (!res.error && res.data) router.push(`/vendor/penerimaan/${res.data.id}`);
  }

  const nullable = (v: string) => (v === "" ? null : v);
  const capOf = (id: string) => baris.find((b) => b.penugasanDetailId === id);
  const totalBaik = details.reduce((s, d) => s + (Number(d.jumlahBaik) || 0), 0);
  const totalRusak = details.reduce((s, d) => s + (Number(d.jumlahRusak) || 0), 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="Hasil perbaikan dari retur (opsional)"
            placeholder="— Setoran biasa —"
            options={returOptions.map((r) => ({ label: `${r.nomorDokumen} — ${r.pihakNama} (${r.penugasanNomor})`, value: r.id }))}
            value={returId}
            onChange={(v) => {
              const id = (v as string) ?? null;
              setValue("returId", id);
              const r = returOptions.find((x) => x.id === id);
              if (r) setValue("penugasanId", r.penugasanId, { shouldValidate: true });
              replace([]);
            }}
            disabled={!!initialReturId}
          />
          <ComboSelect
            label="Penugasan"
            required
            placeholder="Pilih penugasan aktif"
            options={penugasanOptions.map((p) => ({ label: `${p.nomorDokumen} — ${p.pihakNama} (${p.poNomor})`, value: p.id }))}
            value={penugasanId || null}
            onChange={(v) => {
              setValue("penugasanId", (v as string) ?? "", { shouldValidate: true });
              replace([]);
            }}
            error={errors.penugasanId}
            disabled={modeRetur}
          />
          <Input type="datetime-local" label="Tanggal & Jam Terima" required {...register("tanggalJam")} error={errors.tanggalJam?.message} />
          <Input label="Penerima" required placeholder="Petugas gudang" {...register("penerima")} error={errors.penerima?.message} />
          <Select
            label="Lokasi Terima"
            options={[{ value: "", label: "— Pilih lokasi —" }, ...lokasiList.filter((l) => l.isActive).map((l) => ({ value: l.id, label: `${l.kode} — ${l.nama}` }))]}
            {...register("lokasiId", { setValueAs: nullable })}
          />
          <Input type="date" label="Tanggal Kirim dari Vendor" {...register("tanggalKirimVendor")} />
          <Input label="Pengirim (vendor)" placeholder="Opsional" {...register("pengirimVendor")} />
          <Input label="Kurir / Resi" placeholder="Opsional" {...register("kurirResi")} />
          <Input label="URL Bukti" placeholder="Opsional" {...register("buktiUrl")} />
          <Input label="Catatan" placeholder="Opsional" {...register("catatan")} />
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-dark dark:text-white">Hasil per Bundel</h3>
          <span className="text-sm text-dark-5 dark:text-dark-6">baik {totalBaik} · rusak {totalRusak}</span>
        </div>
        <p className="mb-3 text-xs text-dark-5 dark:text-dark-6">
          Baik = baik secara visual (QC formal di tahap berikutnya). Rusak otomatis membuka kasus selisih.
        </p>

        {!penugasanId && !returId && <p className="text-sm text-gray-500 dark:text-gray-400">Pilih penugasan dulu.</p>}
        {(penugasanId || returId) && baris.length > 0 && fields.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada sisa di vendor untuk diterima.</p>
        )}
        {typeof errors.details?.message === "string" && <p className="mb-3 text-xs text-red-500">{errors.details.message}</p>}

        {fields.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke text-left text-xs uppercase text-dark-5 dark:border-dark-3 dark:text-dark-6">
                  <th className="py-2 pr-3">Bundel</th>
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3">Warna / Ukuran</th>
                  <th className="py-2 pr-3 text-right">Sisa di Vendor</th>
                  <th className="py-2 pr-3">Baik</th>
                  <th className="py-2 pr-3">Rusak</th>
                  <th className="py-2">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f, i) => {
                  const b = capOf(details[i]?.penugasanDetailId);
                  const kembali = (Number(details[i]?.jumlahBaik) || 0) + (Number(details[i]?.jumlahRusak) || 0);
                  const over = b ? kembali > b.cap : false;
                  return (
                    <tr key={f.id} className="border-b border-stroke/60 dark:border-dark-3/60">
                      <td className="py-2 pr-3 font-medium text-dark dark:text-white">{b?.bundelNomor}</td>
                      <td className="py-2 pr-3">{b?.sku}</td>
                      <td className="py-2 pr-3">{b?.warnaNama} / {b?.ukuran}</td>
                      <td className="py-2 pr-3 text-right">
                        <span className={over ? "font-semibold text-red-600" : ""}>{b?.cap}</span>
                        <p className="text-[10px] text-dark-5 dark:text-dark-6">{b?.info}</p>
                      </td>
                      <td className="py-2 pr-3"><Input type="number" step="1" className="w-24" {...register(`details.${i}.jumlahBaik`, { valueAsNumber: true })} error={errors.details?.[i]?.jumlahBaik?.message} /></td>
                      <td className="py-2 pr-3"><Input type="number" step="1" className="w-24" {...register(`details.${i}.jumlahRusak`, { valueAsNumber: true })} error={errors.details?.[i]?.jumlahRusak?.message} /></td>
                      <td className="py-2"><Input className="w-40" placeholder="Opsional" {...register(`details.${i}.catatan`)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" loading={isCancelling} onClick={() => startCancel(() => router.push("/vendor/penerimaan"))}>Batal</Button>
        <Button type="submit" loading={create.isPending}>Simpan Penerimaan</Button>
      </div>
    </form>
  );
}
