"use client";

import { useEffect, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { pengirimanSchema, type PengirimanInput } from "@/lib/schemas/pengiriman-jahit";
import { usePengirimanMutation, useDetailBelumDikirim } from "@/hooks/usePengirimanJahit";
import type { PenugasanBisaDikirim } from "@/services/penugasan-jahit";
import type { LokasiRow } from "../../lokasi/_components/LokasiTable";

interface Props {
  penugasanOptions: PenugasanBisaDikirim[];
  lokasiList: LokasiRow[];
  initialPenugasanId?: string;
}

// Referensi stabil untuk dependency effect (alasan: lihat PenerimaanForm).
const KOSONG: never[] = [];

const nowLocalISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export function PengirimanForm({ penugasanOptions, lokasiList, initialPenugasanId = "" }: Props) {
  const router = useRouter();
  const { create } = usePengirimanMutation();
  const [isCancelling, startCancel] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PengirimanInput>({
    resolver: zodResolver(pengirimanSchema),
    defaultValues: {
      penugasanId: initialPenugasanId,
      tanggalJam: nowLocalISO(),
      lokasiAsalId: lokasiList.find((l) => l.jenis === "workshop_internal" && l.isActive)?.id ?? null,
      lokasiTujuanId: penugasanOptions.find((p) => p.id === initialPenugasanId)?.lokasiTujuanId ?? null,
      pengirim: "",
      penerima: "",
      kendaraan: "",
      kurir: "",
      buktiFotoUrl: "",
      catatan: "",
      details: [],
    },
  });

  const { append, remove, replace } = useFieldArray({ control, name: "details" });
  const details = watch("details");
  const penugasanId = watch("penugasanId");
  const { data: kandidat = KOSONG } = useDetailBelumDikirim(penugasanId);

  // default: semua bundel yang belum dikirim ikut (kasus umum kirim sekaligus)
  useEffect(() => {
    if (kandidat.length > 0 && details.length === 0) {
      replace(kandidat.map((k) => ({ penugasanDetailId: k.id, kelengkapanPanel: true, aksesoris: "", catatan: "" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kandidat]);

  const toggle = (id: string) => {
    const idx = details.findIndex((d) => d.penugasanDetailId === id);
    if (idx >= 0) remove(idx);
    else append({ penugasanDetailId: id, kelengkapanPanel: true, aksesoris: "", catatan: "" });
  };

  async function onSubmit(data: PengirimanInput) {
    const res = await create.mutateAsync(data);
    if (!res.error && res.data) router.push(`/vendor/pengiriman/${res.data.id}`);
  }

  const nullable = (v: string) => (v === "" ? null : v);
  const lokasiOpts = [
    { value: "", label: "— Pilih lokasi —" },
    ...lokasiList.filter((l) => l.isActive).map((l) => ({ value: l.id, label: `${l.kode} — ${l.nama}` })),
  ];
  const totalPcs = details.reduce((s, d) => s + (kandidat.find((k) => k.id === d.penugasanDetailId)?.jumlahPcs ?? 0), 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="Penugasan"
            required
            placeholder="Pilih penugasan yang masih punya bundel belum dikirim"
            options={penugasanOptions.map((p) => ({ label: `${p.nomorDokumen} — ${p.pihakNama} (${p.poNomor})`, value: p.id }))}
            value={penugasanId || null}
            onChange={(v) => {
              const id = (v as string) ?? "";
              setValue("penugasanId", id, { shouldValidate: true });
              setValue("lokasiTujuanId", penugasanOptions.find((p) => p.id === id)?.lokasiTujuanId ?? null);
              replace([]);
            }}
            error={errors.penugasanId}
          />
          <Input type="datetime-local" label="Tanggal & Jam Kirim" required {...register("tanggalJam")} error={errors.tanggalJam?.message} />
          <Select label="Lokasi Asal" options={lokasiOpts} {...register("lokasiAsalId", { setValueAs: nullable })} />
          <Select label="Lokasi Tujuan" options={lokasiOpts} {...register("lokasiTujuanId", { setValueAs: nullable })} />
          <Input label="Pengirim" placeholder="Nama petugas" {...register("pengirim")} />
          <Input label="Penerima (rencana)" placeholder="Nama di vendor" {...register("penerima")} />
          <Input label="Kendaraan" placeholder="Opsional" {...register("kendaraan")} />
          <Input label="Kurir / Ekspedisi" placeholder="Opsional" {...register("kurir")} />
          <Input label="URL Bukti Foto" placeholder="Opsional — tautan foto" {...register("buktiFotoUrl")} />
          <Input label="Catatan" placeholder="Opsional" {...register("catatan")} />
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-dark dark:text-white">Bundel yang Dikirim</h3>
          <span className="text-sm text-dark-5 dark:text-dark-6">{details.length} bundel · {totalPcs} pcs</span>
        </div>

        {!penugasanId && <p className="text-sm text-gray-500 dark:text-gray-400">Pilih penugasan dulu.</p>}
        {penugasanId && kandidat.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Semua bundel penugasan ini sudah dikirim.</p>
        )}
        {typeof errors.details?.message === "string" && <p className="mb-3 text-xs text-red-500">{errors.details.message}</p>}

        {kandidat.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke text-left text-xs uppercase text-dark-5 dark:border-dark-3 dark:text-dark-6">
                  <th className="py-2 pr-3 w-10" />
                  <th className="py-2 pr-3">Bundel</th>
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3">Warna / Ukuran</th>
                  <th className="py-2 pr-3 text-right">Pcs</th>
                  <th className="py-2 pr-3">Panel Lengkap</th>
                  <th className="py-2">Aksesoris Ikut</th>
                </tr>
              </thead>
              <tbody>
                {kandidat.map((k) => {
                  const idx = details.findIndex((d) => d.penugasanDetailId === k.id);
                  const on = idx >= 0;
                  return (
                    <tr key={k.id} className="border-b border-stroke/60 dark:border-dark-3/60">
                      <td className="py-2 pr-3"><Checkbox checked={on} onChange={() => toggle(k.id)} /></td>
                      <td className="py-2 pr-3 font-medium text-dark dark:text-white">{k.bundelNomor}</td>
                      <td className="py-2 pr-3">{k.sku}</td>
                      <td className="py-2 pr-3">{k.warnaNama} / {k.ukuran}</td>
                      <td className="py-2 pr-3 text-right">{k.jumlahPcs}</td>
                      <td className="py-2 pr-3">
                        {on && (
                          <Checkbox
                            checked={details[idx].kelengkapanPanel}
                            onChange={(c) => setValue(`details.${idx}.kelengkapanPanel`, c)}
                          />
                        )}
                      </td>
                      <td className="py-2">
                        {on && <Input className="w-48" placeholder="Misal: kancing 12, label 12" {...register(`details.${idx}.aksesoris`)} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" loading={isCancelling} onClick={() => startCancel(() => router.push("/vendor/pengiriman"))}>
          Batal
        </Button>
        <Button type="submit" loading={create.isPending}>Kirim & Buat Surat Jalan</Button>
      </div>
    </form>
  );
}
