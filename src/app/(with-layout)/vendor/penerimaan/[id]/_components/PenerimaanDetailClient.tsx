"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { usePenerimaanHasilDetail, usePenerimaanHasilMutation } from "@/hooks/usePenerimaanHasilJahit";
import type { PenerimaanHasilDetailData } from "@/services/penerimaan-hasil-jahit";
import { KLASIFIKASI_LABEL, SELISIH_STATUS_LABEL } from "@/lib/schemas/selisih-jahit";

interface Props {
  id: string;
  initialData: PenerimaanHasilDetailData;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-dark dark:text-white">{value ?? "—"}</p>
    </div>
  );
}

export function PenerimaanDetailClient({ id, initialData }: Props) {
  const router = useRouter();
  const [isPending, startNavigate] = useTransition();
  const [hapusOpen, setHapusOpen] = useState(false);
  const { data } = usePenerimaanHasilDetail(id);
  const { remove } = usePenerimaanHasilMutation();

  const d = data ?? initialData;
  const go = (path: string) => startNavigate(() => router.push(path));
  const totalBaik = d.details.reduce((s, x) => s + x.jumlahBaik, 0);
  const totalRusak = d.details.reduce((s, x) => s + x.jumlahRusak, 0);
  const rusakBelumRetur = d.details.reduce((s, x) => s + Math.max(0, x.jumlahRusak - x.sudahDiretur), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={d.nomorDokumen}
        breadcrumb={[{ label: "Vendor & Gudang" }, { label: "Penerimaan Hasil", href: "/vendor/penerimaan" }, { label: d.nomorDokumen }]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <InfoItem
            label="Penugasan"
            value={<button type="button" className="text-primary hover:underline" onClick={() => go(`/vendor/penugasan/${d.penugasanId}`)}>{d.penugasanNomor}</button>}
          />
          <InfoItem label="PO" value={`${d.poNomor} — ${d.produkNama}`} />
          <InfoItem label="Dari" value={d.pihakNama} />
          <InfoItem
            label="Jenis"
            value={d.returNomor ? <button type="button" className="text-primary hover:underline" onClick={() => go(`/vendor/retur/${d.returId}`)}>Hasil perbaikan {d.returNomor}</button> : "Setoran"}
          />
          <InfoItem label="Diterima" value={formatTanggal(d.tanggalJam, true)} />
          <InfoItem label="Penerima" value={d.penerima} />
          <InfoItem label="Lokasi" value={d.lokasiNama} />
          <InfoItem label="Kirim dari Vendor" value={d.tanggalKirimVendor ? formatTanggal(d.tanggalKirimVendor) : null} />
          <InfoItem label="Pengirim / Resi" value={[d.pengirimVendor, d.kurirResi].filter(Boolean).join(" · ") || null} />
          <InfoItem label="Total" value={`baik ${totalBaik} · rusak ${totalRusak}`} />
          <InfoItem label="Bukti" value={d.buktiUrl ? <a href={d.buktiUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Lihat</a> : null} />
        </div>
        {d.catatan && <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{d.catatan}</p>}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-stroke pt-4 dark:border-dark-3">
          {!d.returId && rusakBelumRetur > 0 && (
            <Button size="sm" onClick={() => go(`/vendor/retur/baru?penerimaan=${id}`)} loading={isPending}>Buat Retur Perbaikan ({rusakBelumRetur} pcs rusak)</Button>
          )}
          <Button size="sm" variant="outline" onClick={() => go(`/vendor/penerimaan/baru?penugasan=${d.penugasanId}`)} loading={isPending}>Terima Lagi (bertahap)</Button>
          <Button size="sm" variant="outline" onClick={() => setHapusOpen(true)}>Hapus</Button>
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-3 font-semibold text-dark dark:text-white">Hasil per Bundel</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke text-left text-xs uppercase text-dark-5 dark:border-dark-3 dark:text-dark-6">
                <th className="py-2 pr-3">Bundel</th>
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Warna / Ukuran</th>
                <th className="py-2 pr-3 text-right">Pcs Bundel</th>
                <th className="py-2 pr-3 text-right">Baik</th>
                <th className="py-2 pr-3 text-right">Rusak</th>
                <th className="py-2 pr-3 text-right">Diretur</th>
                <th className="py-2">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {d.details.map((x) => (
                <tr key={x.id} className="border-b border-stroke/60 dark:border-dark-3/60">
                  <td className="py-2 pr-3 font-medium text-dark dark:text-white">{x.bundelNomor}</td>
                  <td className="py-2 pr-3">{x.sku}</td>
                  <td className="py-2 pr-3">{x.warnaNama} / {x.ukuran}</td>
                  <td className="py-2 pr-3 text-right">{x.jumlahPcs}</td>
                  <td className="py-2 pr-3 text-right">{x.jumlahBaik}</td>
                  <td className={cn("py-2 pr-3 text-right", x.jumlahRusak > 0 && "font-medium text-red-600 dark:text-red-400")}>{x.jumlahRusak}</td>
                  <td className="py-2 pr-3 text-right">{x.sudahDiretur}</td>
                  <td className="py-2">{x.catatan ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-1 font-semibold text-dark dark:text-white">Rekap Penugasan {d.penugasanNomor}</h3>
        <p className="mb-3 text-xs text-dark-5 dark:text-dark-6">sisa = dikirim − baik − hilang disetujui − rusak final (derived, tidak disimpan)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke text-left text-xs uppercase text-dark-5 dark:border-dark-3 dark:text-dark-6">
                <th className="py-2 pr-3">Bundel</th>
                <th className="py-2 pr-3 text-right">Dikirim</th>
                <th className="py-2 pr-3 text-right">Baik</th>
                <th className="py-2 pr-3 text-right">Rusak</th>
                <th className="py-2 pr-3 text-right">Hilang ✓</th>
                <th className="py-2 pr-3 text-right">Rusak Final</th>
                <th className="py-2 text-right">Sisa WIP</th>
              </tr>
            </thead>
            <tbody>
              {d.rekap.map((r) => (
                <tr key={r.penugasanDetailId} className="border-b border-stroke/60 dark:border-dark-3/60">
                  <td className="py-2 pr-3 font-medium text-dark dark:text-white">{r.bundelNomor} <span className="text-xs font-normal text-dark-5">{r.sku}</span></td>
                  <td className="py-2 pr-3 text-right">{r.dikirim ? r.jumlahPcs : <span className="text-xs text-dark-5">belum</span>}</td>
                  <td className="py-2 pr-3 text-right">{r.baik}</td>
                  <td className="py-2 pr-3 text-right">{r.rusak}</td>
                  <td className="py-2 pr-3 text-right">{r.hilangDisetujui}</td>
                  <td className="py-2 pr-3 text-right">{r.rusakFinal}</td>
                  <td className={cn("py-2 text-right font-semibold", r.sisa > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400")}>{r.sisa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {d.selisih.length > 0 && (
        <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
          <h3 className="mb-3 font-semibold text-dark dark:text-white">Kasus Selisih dari Penerimaan Ini</h3>
          <ul className="divide-y divide-stroke dark:divide-dark-3">
            {d.selisih.map((s) => {
              const b = SELISIH_STATUS_LABEL[s.status];
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <button type="button" className="font-medium text-primary hover:underline" onClick={() => go("/vendor/selisih")}>{s.nomorKasus}</button>
                    <span className="ml-2 text-dark-5 dark:text-dark-6">{s.bundelNomor} · {KLASIFIKASI_LABEL[s.klasifikasi]} · {s.jumlah} pcs</span>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", b.className)}>{s.keputusan ? "Diputuskan" : b.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={hapusOpen}
        title="Hapus Penerimaan?"
        message="Kasus rusak otomatis ikut terhapus. Ditolak kalau sudah jadi dasar retur atau ada kasus yang sudah diputuskan."
        confirmLabel="Hapus"
        onConfirm={async () => {
          const res = await remove.mutateAsync(id);
          setHapusOpen(false);
          if (!res.error) router.push("/vendor/penerimaan");
        }}
        onCancel={() => setHapusOpen(false)}
        loading={remove.isPending}
      />
    </div>
  );
}
