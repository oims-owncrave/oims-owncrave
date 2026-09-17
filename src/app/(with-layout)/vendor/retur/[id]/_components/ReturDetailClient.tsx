"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatRupiah, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useReturDetail, useReturMutation } from "@/hooks/useReturJahit";
import type { ReturDetailData } from "@/services/retur-jahit";
import { RETUR_STATUS_LABEL, PENANGGUNG_LABEL } from "@/lib/schemas/retur-jahit";

interface Props {
  id: string;
  initialData: ReturDetailData;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-dark dark:text-white">{value ?? "—"}</p>
    </div>
  );
}

/** Link teks kecil yang navigasi — spinner inline hanya di link yang diklik. */
function NavText({ pending, onClick, children }: { pending: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" disabled={pending} className="inline-flex items-center gap-1.5 text-primary hover:underline disabled:no-underline" onClick={onClick}>
      {children}
      {pending && <Spinner size={12} />}
    </button>
  );
}

const NEXT: Record<ReturDetailData["status"], { status: string; label: string; outline?: boolean }[]> = {
  draft: [{ status: "dikirim", label: "Kirim ke Vendor" }, { status: "dibatalkan", label: "Batalkan", outline: true }],
  dikirim: [{ status: "dibatalkan", label: "Batalkan", outline: true }],
  diterima_kembali: [{ status: "selesai", label: "Tandai Selesai" }],
  selesai: [],
  dibatalkan: [],
};

export function ReturDetailClient({ id, initialData }: Props) {
  const router = useRouter();
  const [isPending, startNavigate] = useTransition();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ status: string; label: string } | null>(null);
  const { data } = useReturDetail(id);
  const { setStatus } = useReturMutation();

  const d = data ?? initialData;
  const badge = RETUR_STATUS_LABEL[d.status];
  const go = (path: string) => {
    setPendingPath(path);
    startNavigate(() => router.push(path));
  };
  const pathPenugasan = `/vendor/penugasan/${d.penugasanId}`;
  const pathPenerimaanAsal = `/vendor/penerimaan/${d.penerimaanAsalId}`;
  const totalPcs = d.details.reduce((s, x) => s + x.jumlah, 0);
  const totalKembali = d.details.reduce((s, x) => s + x.sudahKembali, 0);
  const biaya = d.details.reduce((s, x) => s + (x.penanggungBiaya === "owncrave" ? x.jumlah * Number(x.tarifPerbaikan) : 0), 0);
  const bisaTerima = (d.status === "dikirim" || d.status === "diterima_kembali") && totalKembali < totalPcs;

  return (
    <div className="space-y-6">
      <PageHeader
        title={d.nomorDokumen}
        breadcrumb={[{ label: "Vendor & Gudang" }, { label: "Retur & Perbaikan", href: "/vendor/retur" }, { label: d.nomorDokumen }]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <InfoItem label="Status" value={<span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", badge.className)}>{badge.label}</span>} />
          <InfoItem label="Penugasan" value={<NavText pending={pendingPath === pathPenugasan} onClick={() => go(pathPenugasan)}>{d.penugasanNomor}</NavText>} />
          <InfoItem label="Vendor / Penjahit" value={d.pihakNama} />
          <InfoItem label="Dari Penerimaan" value={d.penerimaanAsalId ? <NavText pending={pendingPath === pathPenerimaanAsal} onClick={() => go(pathPenerimaanAsal)}>{d.penerimaanAsalNomor}</NavText> : null} />
          <InfoItem label="Tanggal Retur" value={formatTanggal(d.tanggalRetur)} />
          <InfoItem label="Target Kembali" value={formatTanggal(d.targetKembali)} />
          <InfoItem label="Progres" value={`${totalKembali}/${totalPcs} pcs kembali`} />
          <InfoItem label="Biaya Owncrave" value={formatRupiah(biaya)} />
        </div>
        <p className="mt-4 text-sm text-gray-700 dark:text-gray-200"><span className="text-xs text-gray-500">Alasan: </span>{d.alasan}</p>
        {d.catatan && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{d.catatan}</p>}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-stroke pt-4 dark:border-dark-3">
          {d.status === "draft" && <Button size="sm" variant="outline" onClick={() => go(`/vendor/retur/${id}/edit`)} loading={isPending}>Edit</Button>}
          {bisaTerima && <Button size="sm" onClick={() => go(`/vendor/penerimaan/baru?retur=${id}`)} loading={isPending}>Terima Hasil Perbaikan</Button>}
          {NEXT[d.status].map((a) => (
            <Button key={a.status} size="sm" variant={a.outline ? "outline" : undefined} onClick={() => setConfirm(a)} loading={setStatus.isPending}>{a.label}</Button>
          ))}
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-3 font-semibold text-dark dark:text-white">Barang Diretur</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke text-left text-xs uppercase text-dark-5 dark:border-dark-3 dark:text-dark-6">
                <th className="py-2 pr-3">Bundel</th>
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3 text-right">Pcs</th>
                <th className="py-2 pr-3 text-right">Kembali</th>
                <th className="py-2 pr-3">Kerusakan</th>
                <th className="py-2 pr-3">Instruksi</th>
                <th className="py-2 pr-3">Biaya</th>
                <th className="py-2">Foto</th>
              </tr>
            </thead>
            <tbody>
              {d.details.map((x) => (
                <tr key={x.id} className="border-b border-stroke/60 dark:border-dark-3/60">
                  <td className="py-2 pr-3 font-medium text-dark dark:text-white">{x.bundelNomor}</td>
                  <td className="py-2 pr-3">{x.sku} <span className="text-xs text-dark-5">{x.warnaNama}/{x.ukuran}</span></td>
                  <td className="py-2 pr-3 text-right">{x.jumlah}</td>
                  <td className="py-2 pr-3 text-right">{x.sudahKembali}</td>
                  <td className="py-2 pr-3">{x.jenisKerusakan ?? "—"}</td>
                  <td className="py-2 pr-3">{x.instruksi ?? "—"}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {PENANGGUNG_LABEL[x.penanggungBiaya].split(" (")[0]}
                    {x.penanggungBiaya === "owncrave" && <span className="ml-1 text-xs text-dark-5">{formatRupiah(x.tarifPerbaikan)}/pcs</span>}
                  </td>
                  <td className="py-2">{x.fotoUrl ? <a href={x.fotoUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Lihat</a> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-3 font-semibold text-dark dark:text-white">Hasil Perbaikan Kembali</h3>
        {d.penerimaanKembali.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada hasil perbaikan yang kembali.</p>
        ) : (
          <ul className="divide-y divide-stroke dark:divide-dark-3">
            {d.penerimaanKembali.map((p) => {
              const path = `/vendor/penerimaan/${p.id}`;
              const pending = pendingPath === path;
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <button type="button" disabled={pending} className="text-left" onClick={() => go(path)}>
                    <p className="flex items-center gap-1.5 font-medium text-primary hover:underline">
                      {p.nomorDokumen}
                      {pending && <Spinner size={12} />}
                    </p>
                    <p className="text-xs text-dark-5 dark:text-dark-6">{formatTanggal(p.tanggalJam, true)}</p>
                  </button>
                  <span className="text-xs whitespace-nowrap">baik {p.totalBaik} · rusak {p.totalRusak}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={`${confirm?.label}?`}
        message={confirm?.status === "selesai" ? "Retur ditutup — penugasan bisa jadi selesai kalau sisa WIP 0." : "Status retur akan diperbarui."}
        confirmLabel="Ya, lanjut"
        onConfirm={() => { if (confirm) setStatus.mutate({ id, status: confirm.status }); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
        loading={setStatus.isPending}
      />
    </div>
  );
}
