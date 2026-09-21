"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatTanggal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { Printer } from "lucide-react";
import { usePengirimanDetail, usePengirimanMutation } from "@/hooks/usePengirimanJahit";
import type { PengirimanDetailData } from "@/services/pengiriman-jahit";
import { PENGIRIMAN_STATUS_LABEL, KONDISI_BUNDEL_LABEL } from "@/lib/schemas/pengiriman-jahit";
import { JENIS_PEKERJAAN_LABEL } from "@/lib/schemas/vendor";
import { SerahTerimaModal } from "./SerahTerimaModal";
import type { LokasiRow } from "../../../lokasi/_components/LokasiTable";

interface Props {
  id: string;
  initialData: PengirimanDetailData;
  lokasiList: LokasiRow[];
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

export function PengirimanDetailClient({ id, initialData, lokasiList }: Props) {
  const router = useRouter();
  const [isPending, startNavigate] = useTransition();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [stOpen, setStOpen] = useState(false);
  const [batalOpen, setBatalOpen] = useState(false);
  const [alasan, setAlasan] = useState("");
  const { data } = usePengirimanDetail(id);
  const { cancel } = usePengirimanMutation();

  const d = data ?? initialData;
  const badge = PENGIRIMAN_STATUS_LABEL[d.status];
  const go = (path: string) => {
    setPendingPath(path);
    startNavigate(() => router.push(path));
  };
  const pathPenugasan = `/vendor/penugasan/${d.penugasanId}`;
  const totalPcs = d.details.reduce((s, x) => s + x.jumlahPcs, 0);
  const stMap = new Map(d.serahTerima?.details.map((x) => [x.pengirimanDetailId, x]) ?? []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={d.nomorDokumen}
        breadcrumb={[
          { label: "Vendor & Gudang" },
          { label: "Pengiriman Vendor", href: "/vendor/pengiriman" },
          { label: d.nomorDokumen },
        ]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <InfoItem
            label="Status"
            value={<span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", badge.className)}>{badge.label}</span>}
          />
          <InfoItem label="Surat Jalan" value={d.sjNomor} />
          <InfoItem
            label="Penugasan"
            value={<NavText pending={pendingPath === pathPenugasan} onClick={() => go(pathPenugasan)}>{d.penugasanNomor}</NavText>}
          />
          <InfoItem label="PO" value={`${d.poNomor} — ${d.produkNama}`} />
          <InfoItem label="Tujuan" value={d.pihakNama} />
          <InfoItem label="Pekerjaan" value={JENIS_PEKERJAAN_LABEL[d.jenisPekerjaan]} />
          <InfoItem label="Dikirim" value={formatTanggal(d.tanggalJam, true)} />
          <InfoItem label="Target Selesai" value={formatTanggal(d.targetSelesai)} />
          <InfoItem label="Lokasi Asal" value={d.lokasiAsalNama} />
          <InfoItem label="Lokasi Tujuan" value={d.lokasiTujuanNama} />
          <InfoItem label="Pengirim" value={d.pengirimNama} />
          <InfoItem label="Kurir / Kendaraan" value={[d.kurir, d.kendaraan].filter(Boolean).join(" · ") || null} />
          <InfoItem label="Total" value={`${d.details.length} bundel · ${totalPcs} pcs`} />
          <InfoItem label="Dibuat oleh" value={d.createdByNama} />
        </div>
        {d.catatan && <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{d.catatan}</p>}
        {d.status === "dibatalkan" && d.alasanBatal && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            Dibatalkan: {d.alasanBatal}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-stroke pt-4 dark:border-dark-3">
          <Button size="sm" variant="outline" onClick={() => go(`/vendor/pengiriman/${id}/surat-jalan`)} loading={isPending}>
            <Printer size={16} className="mr-1.5" /> Surat Jalan
            {d.sjJumlahCetak != null && d.sjJumlahCetak > 0 && (
              <span className="ml-1.5 text-xs text-dark-5 dark:text-dark-6">(dicetak {d.sjJumlahCetak}×)</span>
            )}
          </Button>
          {d.status === "dikirim" && (
            <>
              <Button size="sm" onClick={() => setStOpen(true)}>Catat Serah Terima</Button>
              <Button size="sm" variant="outline" onClick={() => setBatalOpen(true)}>Batalkan Pengiriman</Button>
            </>
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
                <th className="py-2 pr-3">Panel</th>
                <th className="py-2 pr-3">Aksesoris</th>
                {d.serahTerima && <th className="py-2 pr-3 text-right">Diterima</th>}
                {d.serahTerima && <th className="py-2">Kondisi</th>}
              </tr>
            </thead>
            <tbody>
              {d.details.map((x) => {
                const st = stMap.get(x.id);
                return (
                  <tr key={x.id} className="border-b border-stroke/60 dark:border-dark-3/60">
                    <td className="py-2 pr-3 font-medium text-dark dark:text-white">{x.bundelNomor}</td>
                    <td className="py-2 pr-3">{x.sku}</td>
                    <td className="py-2 pr-3">{x.warnaNama} / {x.ukuran}</td>
                    <td className="py-2 pr-3 text-right">{x.jumlahPcs}</td>
                    <td className="py-2 pr-3">{x.kelengkapanPanel ? "Lengkap" : "Tidak lengkap"}</td>
                    <td className="py-2 pr-3">{x.aksesoris ?? "—"}</td>
                    {d.serahTerima && <td className="py-2 pr-3 text-right">{st?.jumlahDiterima ?? "—"}</td>}
                    {d.serahTerima && (
                      <td className="py-2">
                        {st && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              st.kondisi === "lengkap"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                            )}
                          >
                            {KONDISI_BUNDEL_LABEL[st.kondisi]}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {d.serahTerima && (
        <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
          <h3 className="mb-3 font-semibold text-dark dark:text-white">Serah Terima — {d.serahTerima.nomorDokumen}</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InfoItem label="Diterima" value={formatTanggal(d.serahTerima.tanggalJam, true)} />
            <InfoItem label="Penerima" value={d.serahTerima.penerima} />
            <InfoItem label="Lokasi" value={d.serahTerima.lokasiNama} />
            <InfoItem
              label="Bukti"
              value={d.serahTerima.fotoUrl ? <a href={d.serahTerima.fotoUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Lihat</a> : null}
            />
          </div>
          {d.serahTerima.catatan && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{d.serahTerima.catatan}</p>}
        </div>
      )}

      <SerahTerimaModal open={stOpen} onClose={() => setStOpen(false)} pengiriman={d} lokasiList={lokasiList} />

      {batalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !cancel.isPending && setBatalOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-2 dark:border-dark-3 dark:bg-gray-dark">
            <h2 className="mb-2 text-xl font-bold text-dark dark:text-white">Batalkan Pengiriman?</h2>
            <p className="mb-4 text-sm text-dark-5 dark:text-dark-6">
              Bundel kembali ke status siap dikirim. Surat jalan tetap tersimpan dengan watermark DIBATALKAN.
            </p>
            <Input label="Alasan pembatalan" required value={alasan} onChange={(e) => setAlasan(e.target.value)} disabled={cancel.isPending} />
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setBatalOpen(false)} disabled={cancel.isPending}>Kembali</Button>
              <Button
                variant="danger"
                loading={cancel.isPending}
                disabled={!alasan.trim()}
                onClick={async () => {
                  const res = await cancel.mutateAsync({ id, alasan });
                  if (!res.error) { setBatalOpen(false); setAlasan(""); }
                }}
              >
                Batalkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
