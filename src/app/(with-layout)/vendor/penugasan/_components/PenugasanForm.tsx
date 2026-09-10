"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { formatRupiah } from "@/lib/utils";
import { penugasanSchema, type PenugasanInput, PRIORITAS } from "@/lib/schemas/penugasan-jahit";
import { JENIS_PEKERJAAN, JENIS_PEKERJAAN_LABEL } from "@/lib/schemas/vendor";
import { DASAR_TARIF, DASAR_TARIF_LABEL } from "@/lib/schemas/tarif-jasa-jahit";
import { usePenugasanMutation, useBundelSiapTugas, useTarifUntukBundel } from "@/hooks/usePenugasanJahit";
import type { PoSiapJahit } from "@/services/penugasan-jahit";
import type { Vendor } from "@/db/schema";
import type { PenjahitRow } from "../../penjahit/_components/PenjahitTable";
import type { LokasiRow } from "../../lokasi/_components/LokasiTable";

interface Props {
  poOptions: PoSiapJahit[];
  vendorList: Vendor[];
  penjahitList: PenjahitRow[];
  lokasiList: LokasiRow[];
  editId?: string;
  defaultValues?: PenugasanInput;
}

const PRIORITAS_LABEL: Record<(typeof PRIORITAS)[number], string> = {
  rendah: "Rendah",
  normal: "Normal",
  tinggi: "Tinggi",
  urgent: "Urgent",
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export function PenugasanForm({ poOptions, vendorList, penjahitList, lokasiList, editId, defaultValues }: Props) {
  const router = useRouter();
  const { create, update } = usePenugasanMutation();
  const [isCancelling, startCancel] = useTransition();
  const isEditing = !!editId;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PenugasanInput>({
    resolver: zodResolver(penugasanSchema),
    defaultValues: defaultValues ?? {
      poId: "",
      tanggal: todayISO(),
      pihak: "vendor",
      vendorId: null,
      penjahitId: null,
      lokasiTujuanId: null,
      jenisPekerjaan: "jahit_penuh",
      rencanaKirim: "",
      targetSelesai: "",
      prioritas: "normal",
      catatan: "",
      details: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "details" });
  const details = watch("details");
  const poId = watch("poId");
  const pihak = watch("pihak");
  const vendorId = watch("vendorId");
  const penjahitId = watch("penjahitId");
  const jenisPekerjaan = watch("jenisPekerjaan");

  const produkId = poOptions.find((p) => p.id === poId)?.produkId ?? "";
  const { data: bundelList = [] } = useBundelSiapTugas(poId, editId);

  // ganti pihak → bersihkan sisi lain (DB CHECK tepat satu terisi)
  useEffect(() => {
    if (pihak === "vendor") setValue("penjahitId", null);
    else setValue("vendorId", null);
  }, [pihak, setValue]);

  const tarifArgs = useMemo(
    () =>
      produkId && (vendorId || penjahitId)
        ? { produkId, jenisPekerjaan, vendorId, penjahitId, bundlingIds: details.map((d) => d.bundlingId) }
        : null,
    [produkId, jenisPekerjaan, vendorId, penjahitId, details],
  );
  const { data: tarifMap, isFetching: tarifLoading } = useTarifUntukBundel(tarifArgs);

  function isiTarifDariMaster() {
    if (!tarifMap) return;
    details.forEach((d, i) => {
      const t = tarifMap[d.bundlingId];
      if (t) {
        setValue(`details.${i}.tarif`, t.nominal, { shouldValidate: true });
        setValue(`details.${i}.dasarTarif`, t.dasarTarif);
      }
    });
  }

  const dipilih = new Set(details.map((d) => d.bundlingId));
  const toggleBundel = (bundlingId: string) => {
    const idx = details.findIndex((d) => d.bundlingId === bundlingId);
    if (idx >= 0) remove(idx);
    else {
      const t = tarifMap?.[bundlingId];
      append({ bundlingId, tarif: t?.nominal ?? 0, dasarTarif: t?.dasarTarif ?? "per_pcs" });
    }
  };
  const pilihSemua = () =>
    replace(
      bundelList.map((b) => {
        const existing = details.find((d) => d.bundlingId === b.id);
        const t = tarifMap?.[b.id];
        return existing ?? { bundlingId: b.id, tarif: t?.nominal ?? 0, dasarTarif: t?.dasarTarif ?? "per_pcs" };
      }),
    );

  async function onSubmit(data: PenugasanInput) {
    const res = isEditing
      ? await update.mutateAsync({ id: editId, input: data })
      : await create.mutateAsync(data);
    if (!res.error && res.data) router.push(`/vendor/penugasan/${res.data.id}`);
  }

  const isPending = create.isPending || update.isPending;
  const bundelMap = new Map(bundelList.map((b) => [b.id, b]));
  const totalPcs = details.reduce((s, d) => s + (bundelMap.get(d.bundlingId)?.jumlahPcs ?? 0), 0);
  const estimasi = details.reduce(
    (s, d) => s + (bundelMap.get(d.bundlingId)?.jumlahPcs ?? 0) * (Number(d.tarif) || 0),
    0,
  );

  const nullable = (v: string) => (v === "" ? null : v);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="PO Produksi"
            required
            placeholder="Pilih PO yang punya bundel siap kirim"
            options={poOptions.map((p) => ({ label: `${p.nomorDokumen} — ${p.produkNama}`, value: p.id }))}
            value={poId || null}
            onChange={(v) => {
              setValue("poId", (v as string) ?? "", { shouldValidate: true });
              replace([]);
            }}
            error={errors.poId}
            disabled={isEditing}
          />
          <Input type="date" label="Tanggal" required {...register("tanggal")} error={errors.tanggal?.message} />

          <Select
            label="Ditugaskan ke"
            options={[
              { value: "vendor", label: "Vendor (eksternal)" },
              { value: "penjahit", label: "Penjahit (internal / individu)" },
            ]}
            {...register("pihak")}
          />
          {pihak === "vendor" ? (
            <ComboSelect
              label="Vendor"
              required
              placeholder="Pilih vendor aktif"
              options={vendorList
                .filter((v) => v.isActive || v.id === vendorId)
                .map((v) => ({ label: `${v.kode} — ${v.nama}`, value: v.id }))}
              value={vendorId}
              onChange={(v) => setValue("vendorId", (v as string) ?? null, { shouldValidate: true })}
              error={errors.vendorId}
            />
          ) : (
            <ComboSelect
              label="Penjahit"
              required
              placeholder="Pilih penjahit aktif"
              options={penjahitList
                .filter((p) => p.isActive || p.id === penjahitId)
                .map((p) => ({ label: `${p.kode} — ${p.nama}`, value: p.id }))}
              value={penjahitId}
              onChange={(v) => setValue("penjahitId", (v as string) ?? null, { shouldValidate: true })}
              error={errors.penjahitId}
            />
          )}

          <Select
            label="Jenis Pekerjaan"
            options={JENIS_PEKERJAAN.map((j) => ({ value: j, label: JENIS_PEKERJAAN_LABEL[j] }))}
            {...register("jenisPekerjaan")}
            error={errors.jenisPekerjaan?.message}
          />
          <Select
            label="Lokasi Tujuan"
            options={[
              { value: "", label: "— Pilih lokasi (opsional) —" },
              ...lokasiList.filter((l) => l.isActive).map((l) => ({ value: l.id, label: `${l.kode} — ${l.nama}` })),
            ]}
            {...register("lokasiTujuanId", { setValueAs: nullable })}
          />
          <Input type="date" label="Rencana Kirim" {...register("rencanaKirim")} />
          <Input
            type="date"
            label="Target Selesai"
            required
            {...register("targetSelesai")}
            error={errors.targetSelesai?.message}
          />
          <Select
            label="Prioritas"
            options={PRIORITAS.map((p) => ({ value: p, label: PRIORITAS_LABEL[p] }))}
            {...register("prioritas")}
          />
          <Input label="Catatan" placeholder="Opsional" {...register("catatan")} />
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-dark dark:text-white">Bundel yang Ditugaskan</h3>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={pilihSemua} disabled={!poId || bundelList.length === 0}>
              Pilih Semua
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={isiTarifDariMaster}
              loading={tarifLoading}
              disabled={!tarifMap || details.length === 0}
              title="Ambil tarif aktif dari master — nilai jadi snapshot di penugasan ini"
            >
              Isi Tarif dari Master
            </Button>
          </div>
        </div>

        {!poId && <p className="text-sm text-gray-500 dark:text-gray-400">Pilih PO dulu.</p>}
        {poId && bundelList.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada bundel siap kirim yang belum ditugaskan.</p>
        )}
        {typeof errors.details?.message === "string" && (
          <p className="mb-3 text-xs text-red-500">{errors.details.message}</p>
        )}

        {bundelList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke text-left text-xs uppercase text-dark-5 dark:border-dark-3 dark:text-dark-6">
                  <th className="py-2 pr-3 w-10" />
                  <th className="py-2 pr-3">Bundel</th>
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3">Warna / Ukuran</th>
                  <th className="py-2 pr-3 text-right">Pcs</th>
                  <th className="py-2 pr-3">Tarif (Rp)</th>
                  <th className="py-2 pr-3">Dasar</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {bundelList.map((b) => {
                  const idx = details.findIndex((d) => d.bundlingId === b.id);
                  const on = idx >= 0;
                  const row = on ? details[idx] : null;
                  const field = on ? fields[idx] : null;
                  return (
                    <tr key={field?.id ?? b.id} className="border-b border-stroke/60 dark:border-dark-3/60">
                      <td className="py-2 pr-3">
                        <Checkbox checked={on} onChange={() => toggleBundel(b.id)} />
                      </td>
                      <td className="py-2 pr-3 font-medium text-dark dark:text-white">{b.nomorDokumen}</td>
                      <td className="py-2 pr-3">{b.sku}</td>
                      <td className="py-2 pr-3">{b.warnaNama} / {b.ukuran}</td>
                      <td className="py-2 pr-3 text-right">{b.jumlahPcs}</td>
                      <td className="py-2 pr-3">
                        {on && (
                          <Input
                            type="number"
                            step="1"
                            className="w-32"
                            {...register(`details.${idx}.tarif`, { valueAsNumber: true })}
                            error={errors.details?.[idx]?.tarif?.message}
                          />
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {on && (
                          <Select
                            className="w-32"
                            options={DASAR_TARIF.map((d) => ({ value: d, label: DASAR_TARIF_LABEL[d] }))}
                            {...register(`details.${idx}.dasarTarif`)}
                          />
                        )}
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">
                        {on ? formatRupiah(b.jumlahPcs * (Number(row?.tarif) || 0)) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {details.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-end gap-8 border-t border-stroke pt-4 dark:border-dark-3">
            <div className="text-right">
              <span className="text-sm text-dark-5 dark:text-dark-6">Bundel</span>
              <p className="text-lg font-bold text-dark dark:text-white">{details.length}</p>
            </div>
            <div className="text-right">
              <span className="text-sm text-dark-5 dark:text-dark-6">Total Pcs</span>
              <p className="text-lg font-bold text-dark dark:text-white">{totalPcs}</p>
            </div>
            <div className="text-right">
              <span className="text-sm text-dark-5 dark:text-dark-6">Estimasi Biaya</span>
              <p className="text-lg font-bold text-dark dark:text-white">{formatRupiah(estimasi)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          loading={isCancelling}
          onClick={() => startCancel(() => router.push(isEditing ? `/vendor/penugasan/${editId}` : "/vendor/penugasan"))}
        >
          Batal
        </Button>
        <Button type="submit" loading={isPending}>
          {isEditing ? "Simpan Perubahan" : "Simpan (Draft)"}
        </Button>
      </div>
    </form>
  );
}
