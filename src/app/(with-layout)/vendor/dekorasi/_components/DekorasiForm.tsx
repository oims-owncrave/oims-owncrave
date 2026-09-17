"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { formatRupiah } from "@/lib/utils";
import {
  pekerjaanDekorasiSchema,
  type PekerjaanDekorasiInput,
  DEKORASI_JENIS_LABEL,
  DEKORASI_POSISI_LABEL,
} from "@/lib/schemas/dekorasi";
import { usePekerjaanDekorasiMutation, useTemplateProduk } from "@/hooks/useDekorasi";
import type { WoBisaDekorasi, VendorDekorasi } from "@/services/dekorasi";
import type { LokasiRow } from "../../lokasi/_components/LokasiTable";

interface Props {
  woOptions: WoBisaDekorasi[];
  vendorList: VendorDekorasi[];
  lokasiList: LokasiRow[];
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export function DekorasiForm({ woOptions, vendorList, lokasiList }: Props) {
  const router = useRouter();
  const { create } = usePekerjaanDekorasiMutation();
  const [isCancelling, startCancel] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PekerjaanDekorasiInput>({
    resolver: zodResolver(pekerjaanDekorasiSchema),
    defaultValues: {
      woId: "",
      templateId: "",
      vendorId: "",
      lokasiTujuanId: null,
      jumlah: 0,
      tarif: 0,
      tanggal: todayISO(),
      targetSelesai: "",
      pengirim: "",
      kurir: "",
      catatan: "",
    },
  });

  const woId = watch("woId");
  const templateId = watch("templateId");
  const jumlah = watch("jumlah");
  const tarif = watch("tarif");

  const wo = woOptions.find((w) => w.id === woId);
  const { data: templates = [] } = useTemplateProduk(wo?.produkId ?? "");

  // prefill jumlah dari hasil cutting baik + tarif default template
  useEffect(() => {
    if (wo) setValue("jumlah", wo.totalBaik, { shouldValidate: true });
    setValue("templateId", "");
  }, [woId, wo, setValue]);

  useEffect(() => {
    const t = templates.find((x) => x.id === templateId);
    if (t) setValue("tarif", Number(t.tarifDefault), { shouldValidate: true });
  }, [templateId, templates, setValue]);

  async function onSubmit(data: PekerjaanDekorasiInput) {
    const res = await create.mutateAsync(data);
    if (!res.error && res.data) router.push(`/vendor/dekorasi/${res.data.id}`);
  }

  const nullable = (v: string) => (v === "" ? null : v);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[10px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
        Dekorasi jalan <strong>paralel</strong> dengan bundling (dua-duanya dari hasil cutting). Urutan tidak dipaksa sistem.
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComboSelect
            label="WO Cutting"
            required
            placeholder="Pilih WO (produk butuh dekorasi)"
            options={woOptions.map((w) => ({ label: `${w.nomorDokumen} — ${w.produkNama} (${w.totalBaik} pcs baik)`, value: w.id }))}
            value={woId || null}
            onChange={(v) => setValue("woId", (v as string) ?? "", { shouldValidate: true })}
            error={errors.woId}
          />
          <Select
            label="Template Dekorasi"
            options={[
              { value: "", label: templates.length ? "— Pilih template —" : "Produk belum punya template" },
              ...templates.map((t) => ({
                value: t.id,
                label: `${DEKORASI_JENIS_LABEL[t.jenis]} · ${DEKORASI_POSISI_LABEL[t.posisi]} (${formatRupiah(t.tarifDefault)})`,
              })),
            ]}
            {...register("templateId")}
            error={errors.templateId?.message}
            disabled={!woId}
          />
          <ComboSelect
            label="Vendor Dekorasi"
            required
            placeholder="Vendor berkapabilitas sablon/bordir"
            options={vendorList.map((v) => ({ label: `${v.kode} — ${v.nama}`, value: v.id }))}
            value={watch("vendorId") || null}
            onChange={(v) => setValue("vendorId", (v as string) ?? "", { shouldValidate: true })}
            error={errors.vendorId}
          />
          <Select
            label="Lokasi Tujuan"
            options={[{ value: "", label: "— Opsional —" }, ...lokasiList.filter((l) => l.isActive).map((l) => ({ value: l.id, label: `${l.kode} — ${l.nama}` }))]}
            {...register("lokasiTujuanId", { setValueAs: nullable })}
          />
          <NumberInput
            decimals={0}
            placeholder="0" label="Jumlah (pcs)" required value={watch("jumlah")}
  onChange={(v) =>
    setValue("jumlah", v as number, { shouldValidate: true })
  } error={errors.jumlah?.message} />
          <NumberInput
            decimals={0}
            placeholder="0" label="Tarif per Pcs (Rp)" required value={watch("tarif")}
  onChange={(v) =>
    setValue("tarif", v as number, { shouldValidate: true })
  } error={errors.tarif?.message} />
          <Input type="date" label="Tanggal" required {...register("tanggal")} error={errors.tanggal?.message} />
          <Input type="date" label="Target Selesai" {...register("targetSelesai")} />
          <Input label="Pengirim" placeholder="Opsional" {...register("pengirim")} />
          <Input label="Kurir" placeholder="Opsional" {...register("kurir")} />
          <Input label="Catatan" placeholder="Opsional" {...register("catatan")} />
        </div>

        <div className="mt-4 flex justify-end border-t border-stroke pt-4 dark:border-dark-3">
          <div className="text-right">
            <span className="text-sm text-dark-5 dark:text-dark-6">Estimasi Tagihan</span>
            <p className="text-lg font-bold text-dark dark:text-white">{formatRupiah((jumlah || 0) * (tarif || 0))}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" loading={isCancelling} onClick={() => startCancel(() => router.push("/vendor/dekorasi"))}>Batal</Button>
        <Button type="submit" loading={create.isPending}>Simpan (Draft)</Button>
      </div>
    </form>
  );
}
