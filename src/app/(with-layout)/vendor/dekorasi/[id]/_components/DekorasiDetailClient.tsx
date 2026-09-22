"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn, formatRupiah, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { ComboSelect } from "@/components/ui/ComboSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { Printer } from "lucide-react";
import { usePekerjaanDekorasiDetail, usePekerjaanDekorasiMutation } from "@/hooks/useDekorasi";
import { useUserOptions } from "@/hooks/useUser";
import type { PekerjaanDekorasiDetailData } from "@/services/dekorasi";
import {
  penerimaanDekorasiSchema,
  type PenerimaanDekorasiInput,
  DEKORASI_STATUS_LABEL,
  DEKORASI_JENIS_LABEL,
  DEKORASI_POSISI_LABEL,
} from "@/lib/schemas/dekorasi";

interface Props {
  id: string;
  initialData: PekerjaanDekorasiDetailData;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-dark dark:text-white">{value ?? "—"}</p>
    </div>
  );
}

const nowLocalISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export function DekorasiDetailClient({ id, initialData }: Props) {
  const router = useRouter();
  const [isPending, startNavigate] = useTransition();
  const [terimaOpen, setTerimaOpen] = useState(false);
  const [confirm, setConfirm] = useState<"kirim" | "batal" | null>(null);
  const { data } = usePekerjaanDekorasiDetail(id);
  const { kirim, batal, terima } = usePekerjaanDekorasiMutation();
  const { data: userOptions = [] } = useUserOptions();

  const d = data ?? initialData;
  const badge = DEKORASI_STATUS_LABEL[d.status];
  const go = (path: string) => startNavigate(() => router.push(path));
  const sisa = d.jumlah - d.selesai - d.rusak;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PenerimaanDekorasiInput>({
    resolver: zodResolver(penerimaanDekorasiSchema),
    defaultValues: { tanggalJam: nowLocalISO(), penerimaId: "", penerima: "", jumlahSelesai: undefined, jumlahRusak: undefined, catatan: "" },
  });

  const penerimaId = watch("penerimaId");

  const bukaTerima = () => {
    reset({ tanggalJam: nowLocalISO(), penerimaId: "", penerima: "", jumlahSelesai: sisa, jumlahRusak: undefined, catatan: "" });
    setTerimaOpen(true);
  };

  const onTerima = async (input: PenerimaanDekorasiInput) => {
    const res = await terima.mutateAsync({ pekerjaanId: id, input });
    if (!res.error) setTerimaOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={d.nomorDokumen}
        breadcrumb={[{ label: "Sablon & Bordir" }, { label: "Pekerjaan Dekorasi", href: "/vendor/dekorasi" }, { label: d.nomorDokumen }]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <InfoItem label="Status" value={<span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", badge.className)}>{badge.label}</span>} />
          <InfoItem label="WO Cutting" value={d.woNomor} />
          <InfoItem label="PO" value={`${d.poNomor} — ${d.produkNama}`} />
          <InfoItem label="Dekorasi" value={`${DEKORASI_JENIS_LABEL[d.jenis]} · ${DEKORASI_POSISI_LABEL[d.posisi]}`} />
          <InfoItem label="Vendor" value={d.vendorNama} />
          <InfoItem label="Lokasi Tujuan" value={d.lokasiTujuanNama} />
          <InfoItem label="Jumlah Dikirim" value={`${d.jumlah} pcs`} />
          <InfoItem label="Progres" value={`${d.selesai} selesai · ${d.rusak} rusak · sisa ${sisa}`} />
          <InfoItem label="Tarif" value={`${formatRupiah(d.tarifSnapshot)}/pcs`} />
          <InfoItem label="Tagihan (selesai × tarif)" value={formatRupiah(d.selesai * Number(d.tarifSnapshot))} />
          <InfoItem label="Dikirim" value={formatTanggal(d.tanggalKirim)} />
          <InfoItem label="Target Selesai" value={formatTanggal(d.targetSelesai)} />
          <InfoItem label="Surat Jalan" value={d.sjNomor} />
        </div>
        {d.deskripsi && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Spesifikasi: {d.deskripsi}</p>}
        {d.catatan && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{d.catatan}</p>}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-stroke pt-4 dark:border-dark-3">
          {d.status === "draft" && (
            <>
              <Button size="sm" onClick={() => setConfirm("kirim")} loading={kirim.isPending}>Kirim ke Vendor</Button>
              <Button size="sm" variant="outline" onClick={() => setConfirm("batal")} loading={batal.isPending}>Batalkan</Button>
            </>
          )}
          {d.sjNomor && (
            <Button size="sm" variant="outline" onClick={() => go(`/vendor/dekorasi/${id}/surat-jalan`)} loading={isPending}>
              <Printer size={16} className="mr-1.5" /> Surat Jalan
            </Button>
          )}
          {d.status === "dikirim" && sisa > 0 && <Button size="sm" onClick={bukaTerima}>Terima Hasil ({sisa} pcs sisa)</Button>}
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-3 font-semibold text-dark dark:text-white">Riwayat Penerimaan</h3>
        {d.penerimaan.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada hasil diterima.</p>
        ) : (
          <ul className="divide-y divide-stroke dark:divide-dark-3">
            {d.penerimaan.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-dark dark:text-white">{p.nomorDokumen}</p>
                  <p className="text-xs text-dark-5 dark:text-dark-6">{formatTanggal(p.tanggalJam, true)} · {p.penerima}{p.catatan ? ` · ${p.catatan}` : ""}</p>
                </div>
                <span className="whitespace-nowrap text-xs">selesai {p.jumlahSelesai}{p.jumlahRusak > 0 && <span className="ml-1 text-red-600 dark:text-red-400">rusak {p.jumlahRusak}</span>}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {terimaOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !terima.isPending && setTerimaOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
            <h2 className="mb-1 text-xl font-bold text-dark dark:text-white">Terima Hasil Dekorasi</h2>
            <p className="mb-4 text-sm text-dark-5 dark:text-dark-6">{d.nomorDokumen} · sisa {sisa} pcs</p>
            <form onSubmit={handleSubmit(onTerima)} className="space-y-4">
              <Input type="datetime-local" label="Tanggal & Jam" required {...register("tanggalJam")} error={errors.tanggalJam?.message} />
              <ComboSelect
                label="Penerima (staf internal)"
                placeholder="Pilih staf penerima..."
                clearable
                options={userOptions
                  .filter((u) => u.isActive || u.id === penerimaId)
                  .map((u) => ({ value: u.id, label: u.displayName }))}
                value={penerimaId || null}
                onChange={(v) => {
                  const id = (v as string) ?? "";
                  setValue("penerimaId", id);
                  const u = userOptions.find((x) => x.id === id);
                  setValue("penerima", u?.displayName ?? "", { shouldValidate: true });
                }}
              />
              <Input label="Nama Penerima" required placeholder="Nama penerima" {...register("penerima")} error={errors.penerima?.message} />
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput
            decimals={0}
            placeholder="0" label="Selesai (pcs)" value={watch("jumlahSelesai")}
  onChange={(v) =>
    setValue("jumlahSelesai", v as number, { shouldValidate: true })
  } error={errors.jumlahSelesai?.message} />
                <NumberInput
            decimals={0}
            placeholder="0" label="Rusak (pcs)" value={watch("jumlahRusak")}
  onChange={(v) =>
    setValue("jumlahRusak", v as number, { shouldValidate: true })
  } error={errors.jumlahRusak?.message} />
              </div>
              <Input label="Catatan" placeholder="Opsional" {...register("catatan")} />
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setTerimaOpen(false)} disabled={terima.isPending}>Batal</Button>
                <Button type="submit" loading={terima.isPending}>Simpan</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "kirim" ? "Kirim ke Vendor Dekorasi?" : "Batalkan Pekerjaan?"}
        message={confirm === "kirim" ? "Surat jalan dibuat otomatis dan siap dicetak." : "Hanya bisa dibatalkan selama belum ada hasil diterima."}
        confirmLabel="Ya, lanjut"
        onConfirm={() => {
          if (confirm === "kirim") kirim.mutate(id);
          if (confirm === "batal") batal.mutate(id);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
        loading={kirim.isPending || batal.isPending}
      />
    </div>
  );
}
