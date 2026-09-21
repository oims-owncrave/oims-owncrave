"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useBomDetail, useBomMutation } from "@/hooks/useBom";
import type { BomDetailData } from "@/services/bom";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  bomId: string;
  initialData: BomDetailData;
}

const STATUS_BADGE: Record<BomDetailData["status"], { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  aktif: {
    label: "Aktif",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  nonaktif: {
    label: "Nonaktif",
    className: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  },
};

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-dark dark:text-white">{value ?? "—"}</p>
    </div>
  );
}

export function BomDetailClient({ bomId, initialData }: Props) {
  const router = useRouter();
  const [isPending, startNavigate] = useTransition();
  const [activateOpen, setActivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data } = useBomDetail(bomId);
  const { activate, deactivate, newVersion, remove } = useBomMutation();

  const detail = data ?? initialData;
  const badge = STATUS_BADGE[detail.status];
  const go = (path: string) => startNavigate(() => router.push(path));

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.nomorDokumen}
        breadcrumb={[
          { label: "Produksi" },
          { label: "BOM", href: "/master/data-produk?tab=bom" },
          { label: detail.nomorDokumen },
        ]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <InfoItem label="Produk" value={`${detail.produkKode} — ${detail.produkNama}`} />
          <InfoItem label="Versi" value={String(detail.versi)} />
          <InfoItem
            label="Status"
            value={
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", badge.className)}>
                {badge.label}
              </span>
            }
          />
          <InfoItem
            label="Tanggal Berlaku"
            value={
              detail.tanggalBerlaku
                ? new Date(detail.tanggalBerlaku).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"
            }
          />
          <InfoItem label="Catatan" value={detail.catatan} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-stroke pt-4 dark:border-dark-3">
          {detail.status === "draft" && (
            <>
              <Button size="sm" onClick={() => setActivateOpen(true)} loading={activate.isPending}>
                Aktifkan
              </Button>
              <Button size="sm" variant="outline" onClick={() => go(`/produksi/bom/${bomId}/edit`)} loading={isPending}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDeleteOpen(true)} loading={remove.isPending}>
                Hapus
              </Button>
            </>
          )}
          {detail.status === "aktif" && (
            <Button size="sm" variant="outline" onClick={() => deactivate.mutate(bomId)} loading={deactivate.isPending}>
              Nonaktifkan
            </Button>
          )}
          {detail.status !== "draft" && (
            <Button size="sm" variant="outline" onClick={() => newVersion.mutate(bomId)} loading={newVersion.isPending}>
              Buat Versi Baru
            </Button>
          )}
        </div>
      </div>

      {/* Detail bahan (read-only) */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <h3 className="border-b border-stroke px-5 py-4 font-semibold text-dark dark:border-dark-3 dark:text-white">
          Kebutuhan Bahan per Pcs
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-dark-2 dark:text-gray-400">
                <th className="px-5 py-3 font-medium">No.</th>
                <th className="px-5 py-3 font-medium">Bahan</th>
                <th className="px-5 py-3 font-medium text-right">Kuantitas</th>
                <th className="px-5 py-3 font-medium text-right">Toleransi</th>
                <th className="px-5 py-3 font-medium">Ukuran</th>
                <th className="px-5 py-3 font-medium">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {detail.details.map((d, i) => (
                <tr key={d.id} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3 text-dark dark:text-white">
                    {d.bahanKode} — {d.bahanNama}
                  </td>
                  <td className="px-5 py-3 text-right text-dark dark:text-white">
                    {Number(d.kuantitas)} {d.satuanSingkatan}
                  </td>
                  <td className="px-5 py-3 text-right text-dark dark:text-white">
                    {Number(d.toleransiPersen)}%
                  </td>
                  <td className="px-5 py-3 text-dark dark:text-white">{d.berlakuUkuran ?? "Semua"}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{d.keterangan ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={activateOpen}
        title="Aktifkan BOM?"
        message="Versi aktif lama produk ini (jika ada) otomatis dinonaktifkan."
        confirmLabel="Aktifkan"
        onConfirm={() => {
          activate.mutate(bomId);
          setActivateOpen(false);
        }}
        onCancel={() => setActivateOpen(false)}
        loading={activate.isPending}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Hapus BOM?"
        message="BOM draft ini akan dihapus."
        confirmLabel="Hapus"
        onConfirm={() => {
          remove.mutate(bomId, { onSuccess: (res) => { if (!res.error) router.push("/master/data-produk?tab=bom"); } });
          setDeleteOpen(false);
        }}
        onCancel={() => setDeleteOpen(false)}
        loading={remove.isPending}
      />
    </div>
  );
}
