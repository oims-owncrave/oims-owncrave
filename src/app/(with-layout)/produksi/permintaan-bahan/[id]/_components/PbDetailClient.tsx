"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePermintaanDetail, usePermintaanMutation } from "@/hooks/usePermintaanBahan";
import type { PbDetailData } from "@/services/permintaan-bahan";
import { PB_STATUS_BADGE } from "../../_components/pb-status";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  pbId: string;
  initialData: PbDetailData;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-dark dark:text-white">{value ?? "—"}</p>
    </div>
  );
}

function fmtDate(d: Date | string | null) {
  return d
    ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : "—";
}

const fmtQty = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);

export function PbDetailClient({ pbId, initialData }: Props) {
  const router = useRouter();
  const [isPending, startNavigate] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data } = usePermintaanDetail(pbId);
  const { submit, approve, reject, remove } = usePermintaanMutation();

  const detail = data ?? initialData;
  const badge = PB_STATUS_BADGE[detail.status];
  const go = (path: string) => startNavigate(() => router.push(path));

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.nomorDokumen}
        breadcrumb={[
          { label: "Produksi" },
          { label: "Permintaan Bahan", href: "/produksi/permintaan-bahan" },
          { label: detail.nomorDokumen },
        ]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <InfoItem label="PO" value={`${detail.poNomor} — ${detail.produkNama}`} />
          <InfoItem
            label="Status"
            value={
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", badge.className)}>
                {detail.selesai ? "Selesai (semua dikeluarkan)" : badge.label}
              </span>
            }
          />
          <InfoItem label="Tanggal" value={fmtDate(detail.tanggal)} />
          <InfoItem label="Dibutuhkan" value={fmtDate(detail.tanggalDibutuhkan)} />
          <InfoItem label="Catatan" value={detail.catatan} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-stroke pt-4 dark:border-dark-3">
          {detail.status === "draft" && (
            <>
              <Button size="sm" onClick={() => submit.mutate(pbId)} loading={submit.isPending}>
                Ajukan ke Gudang
              </Button>
              <Button size="sm" variant="outline" onClick={() => go(`/produksi/permintaan-bahan/${pbId}/edit`)} loading={isPending}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDeleteOpen(true)} loading={remove.isPending}>
                Hapus
              </Button>
            </>
          )}
          {detail.status === "diajukan" && (
            <>
              <Button size="sm" onClick={() => approve.mutate(pbId)} loading={approve.isPending}>
                Setujui
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)} loading={reject.isPending}>
                Tolak
              </Button>
            </>
          )}
          {detail.status === "disetujui" && !detail.selesai && (
            <Button size="sm" onClick={() => go("/inventory/barang-keluar/baru")} loading={isPending}>
              Keluarkan via Barang Keluar
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <h3 className="border-b border-stroke px-5 py-4 font-semibold text-dark dark:border-dark-3 dark:text-white">
          Detail Bahan
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-dark-2 dark:text-gray-400">
                <th className="px-5 py-3 font-medium">Bahan</th>
                <th className="px-5 py-3 font-medium text-right">Kebutuhan</th>
                <th className="px-5 py-3 font-medium text-right">Diminta</th>
                <th className="px-5 py-3 font-medium text-right">Disetujui</th>
                <th className="px-5 py-3 font-medium text-right">Dikeluarkan</th>
                <th className="px-5 py-3 font-medium text-right">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {detail.details.map((d) => {
                const disetujui = d.jumlahDisetujui !== null ? Number(d.jumlahDisetujui) : null;
                const acuan = disetujui ?? Number(d.jumlahDiminta);
                const sisa = Math.max(0, acuan - d.jumlahDikeluarkan);
                return (
                  <tr key={d.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-5 py-3 text-dark dark:text-white">
                      {d.bahanKode} — {d.bahanNama}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {fmtQty(Number(d.kebutuhan))} {d.satuanSingkatan}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {fmtQty(Number(d.jumlahDiminta))} {d.satuanSingkatan}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {disetujui !== null ? `${fmtQty(disetujui)} ${d.satuanSingkatan}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {fmtQty(d.jumlahDikeluarkan)} {d.satuanSingkatan}
                    </td>
                    <td className={cn("px-5 py-3 text-right font-medium", sisa > 0 ? "text-yellow-700 dark:text-yellow-300" : "text-green-700 dark:text-green-300")}>
                      {detail.status === "disetujui" ? `${fmtQty(sisa)} ${d.satuanSingkatan}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        title="Tolak Permintaan?"
        message="Permintaan yang ditolak tidak bisa diajukan ulang — buat permintaan baru."
        confirmLabel="Tolak"
        onConfirm={() => {
          reject.mutate(pbId);
          setRejectOpen(false);
        }}
        onCancel={() => setRejectOpen(false)}
        loading={reject.isPending}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Hapus Permintaan?"
        message="Permintaan draft ini akan dihapus."
        confirmLabel="Hapus"
        onConfirm={() => {
          remove.mutate(pbId, { onSuccess: (res) => { if (!res.error) router.push("/produksi/permintaan-bahan"); } });
          setDeleteOpen(false);
        }}
        onCancel={() => setDeleteOpen(false)}
        loading={remove.isPending}
      />
    </div>
  );
}
