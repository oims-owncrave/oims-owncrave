"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatRupiah, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { usePenugasanDetail, usePenugasanMutation } from "@/hooks/usePenugasanJahit";
import type { PenugasanDetailData } from "@/services/penugasan-jahit";
import { PENUGASAN_STATUS_LABEL } from "@/lib/schemas/penugasan-jahit";
import { PENGIRIMAN_STATUS_LABEL } from "@/lib/schemas/pengiriman-jahit";
import { JENIS_PEKERJAAN_LABEL } from "@/lib/schemas/vendor";
import { DASAR_TARIF_LABEL } from "@/lib/schemas/tarif-jasa-jahit";

interface Props {
  id: string;
  initialData: PenugasanDetailData;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-dark dark:text-white">{value ?? "—"}</p>
    </div>
  );
}

export function PenugasanDetailClient({ id, initialData }: Props) {
  const router = useRouter();
  const [isPending, startNavigate] = useTransition();
  const [confirm, setConfirm] = useState<{ status: string; label: string } | null>(null);
  const { data } = usePenugasanDetail(id);
  const { setStatus } = usePenugasanMutation();

  const d = data ?? initialData;
  const badge = PENUGASAN_STATUS_LABEL[d.status];
  const go = (path: string) => startNavigate(() => router.push(path));

  const totalPcs = d.details.reduce((s, x) => s + x.jumlahPcs, 0);
  const estimasi = d.details.reduce((s, x) => s + x.jumlahPcs * Number(x.tarifSnapshot), 0);
  const belumDikirim = d.details.filter((x) => !x.sudahDikirim).length;
  const bisaKirim = (d.status === "draft" || d.status === "aktif") && belumDikirim > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={d.nomorDokumen}
        breadcrumb={[
          { label: "Vendor & Gudang" },
          { label: "Penugasan Jahit", href: "/vendor/penugasan" },
          { label: d.nomorDokumen },
        ]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <InfoItem label="PO" value={`${d.poNomor} — ${d.produkNama}`} />
          <InfoItem
            label="Status"
            value={<span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", badge.className)}>{badge.label}</span>}
          />
          <InfoItem label={d.vendorId ? "Vendor" : "Penjahit"} value={d.pihakNama} />
          <InfoItem label="Pekerjaan" value={JENIS_PEKERJAAN_LABEL[d.jenisPekerjaan]} />
          <InfoItem label="Tanggal" value={formatTanggal(d.tanggal)} />
          <InfoItem label="Rencana Kirim" value={formatTanggal(d.rencanaKirim)} />
          <InfoItem label="Target Selesai" value={formatTanggal(d.targetSelesai)} />
          <InfoItem label="Lokasi Tujuan" value={d.lokasiTujuanNama} />
          <InfoItem label="Prioritas" value={d.prioritas} />
          <InfoItem label="Total" value={`${d.details.length} bundel · ${totalPcs} pcs`} />
          <InfoItem label="Estimasi Biaya" value={formatRupiah(estimasi)} />
        </div>
        {d.catatan && <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{d.catatan}</p>}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-stroke pt-4 dark:border-dark-3">
          {d.status === "draft" && (
            <>
              <Button size="sm" variant="outline" onClick={() => go(`/vendor/penugasan/${id}/edit`)} loading={isPending}>Edit</Button>
              <Button size="sm" onClick={() => setConfirm({ status: "aktif", label: "Aktifkan Penugasan" })} loading={setStatus.isPending}>
                Aktifkan
              </Button>
            </>
          )}
          {bisaKirim && (
            <Button size="sm" onClick={() => go(`/vendor/pengiriman/baru?penugasan=${id}`)} loading={isPending}>
              Buat Pengiriman ({belumDikirim} bundel)
            </Button>
          )}
          {(d.status === "draft" || d.status === "aktif") && (
            <Button size="sm" variant="outline" onClick={() => setConfirm({ status: "dibatalkan", label: "Batalkan Penugasan" })} loading={setStatus.isPending}>
              Batalkan
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-3 font-semibold text-dark dark:text-white">Bundel</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke text-left text-xs uppercase text-dark-5 dark:border-dark-3 dark:text-dark-6">
                <th className="py-2 pr-3">Bundel</th>
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Warna / Ukuran</th>
                <th className="py-2 pr-3 text-right">Pcs</th>
                <th className="py-2 pr-3 text-right">Tarif (snapshot)</th>
                <th className="py-2 pr-3 text-right">Subtotal</th>
                <th className="py-2">Pengiriman</th>
              </tr>
            </thead>
            <tbody>
              {d.details.map((x) => (
                <tr key={x.id} className="border-b border-stroke/60 dark:border-dark-3/60">
                  <td className="py-2 pr-3 font-medium text-dark dark:text-white">{x.bundelNomor}</td>
                  <td className="py-2 pr-3">{x.sku}</td>
                  <td className="py-2 pr-3">{x.warnaNama} / {x.ukuran}</td>
                  <td className="py-2 pr-3 text-right">{x.jumlahPcs}</td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap">
                    {formatRupiah(x.tarifSnapshot)}
                    <span className="ml-1 text-xs text-dark-5 dark:text-dark-6">/{DASAR_TARIF_LABEL[x.dasarTarif].replace("Per ", "").toLowerCase()}</span>
                  </td>
                  <td className="py-2 pr-3 text-right">{formatRupiah(x.jumlahPcs * Number(x.tarifSnapshot))}</td>
                  <td className="py-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        x.sudahDikirim
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                      )}
                    >
                      {x.sudahDikirim ? "Sudah dikirim" : "Belum dikirim"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-3 font-semibold text-dark dark:text-white">Riwayat Pengiriman</h3>
        {d.pengiriman.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada pengiriman.</p>
        ) : (
          <ul className="divide-y divide-stroke dark:divide-dark-3">
            {d.pengiriman.map((p) => {
              const b = PENGIRIMAN_STATUS_LABEL[p.status];
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <button type="button" onClick={() => go(`/vendor/pengiriman/${p.id}`)} className="text-left">
                    <p className="font-medium text-primary hover:underline">{p.nomorDokumen}</p>
                    <p className="text-xs text-dark-5 dark:text-dark-6">
                      {formatTanggal(p.tanggalJam, true)} · {p.totalBundel} bundel
                    </p>
                  </button>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", b.className)}>{b.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={`${confirm?.label}?`}
        message={
          confirm?.status === "dibatalkan"
            ? "Penugasan dibatalkan — bundel kembali bebas ditugaskan. Tidak bisa dibatalkan kalau sudah ada pengiriman aktif."
            : "Penugasan aktif siap dikirim ke vendor/penjahit."
        }
        confirmLabel="Ya, lanjut"
        onConfirm={() => {
          if (confirm) setStatus.mutate({ id, status: confirm.status });
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
        loading={setStatus.isPending}
      />
    </div>
  );
}
