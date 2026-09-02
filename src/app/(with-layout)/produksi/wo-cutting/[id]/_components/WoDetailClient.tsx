"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useWoDetail, useWoMutation } from "@/hooks/useWoCutting";
import type { WoDetailData } from "@/services/wo-cutting";
import { WO_STATUS_BADGE, WO_NEXT_ACTIONS } from "../../_components/wo-status";
import { PemakaianSection } from "./PemakaianSection";
import { HasilSection } from "./HasilSection";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  woId: string;
  initialData: WoDetailData;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-dark dark:text-white">{value ?? "—"}</p>
    </div>
  );
}

export function WoDetailClient({ woId, initialData }: Props) {
  const router = useRouter();
  const [, startNavigate] = useTransition();
  const [confirmStatus, setConfirmStatus] = useState<{ status: string; label: string } | null>(null);
  const { data } = useWoDetail(woId);
  const { setStatus } = useWoMutation();

  const detail = data ?? initialData;
  const badge = WO_STATUS_BADGE[detail.status];
  const nextActions = WO_NEXT_ACTIONS[detail.status];
  const go = (path: string) => startNavigate(() => router.push(path));

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.nomorDokumen}
        breadcrumb={[
          { label: "Produksi" },
          { label: "WO Cutting", href: "/produksi/wo-cutting" },
          { label: detail.nomorDokumen },
        ]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <InfoItem label="PO" value={`${detail.poNomor} — ${detail.produkNama}`} />
          <InfoItem
            label="Status"
            value={
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", badge.className)}>
                {badge.label}
              </span>
            }
          />
          <InfoItem label="PIC" value={detail.picNama} />
          <InfoItem label="Meja" value={detail.mejaCutting} />
          <InfoItem label="Jumlah Layer" value={detail.jumlahLayer !== null ? String(detail.jumlahLayer) : null} />
          <InfoItem
            label="Panjang Marker"
            value={detail.panjangMarker !== null ? `${Number(detail.panjangMarker)} m` : null}
          />
          <InfoItem
            label="Lebar Kain"
            value={detail.lebarKain !== null ? `${Number(detail.lebarKain)} cm` : null}
          />
          <InfoItem label="Nomor Pola" value={detail.nomorPola} />
        </div>
        {detail.catatan && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{detail.catatan}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-stroke pt-4 dark:border-dark-3">
          {detail.status === "draft" && (
            <Button size="sm" variant="outline" onClick={() => go(`/produksi/wo-cutting/${woId}/edit`)}>
              Edit
            </Button>
          )}
          {nextActions.map((a) => (
            <Button
              key={a.status}
              size="sm"
              variant={a.status === "ditunda" ? "outline" : undefined}
              onClick={() => setConfirmStatus(a)}
              loading={setStatus.isPending}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      <HasilSection woId={woId} woStatus={detail.status} />

      <PemakaianSection woId={woId} poId={detail.poId} />

      <ConfirmDialog
        open={confirmStatus !== null}
        title={`${confirmStatus?.label}?`}
        message="Status WO akan diperbarui."
        confirmLabel="Ya, lanjut"
        onConfirm={() => {
          if (confirmStatus) setStatus.mutate({ id: woId, status: confirmStatus.status });
          setConfirmStatus(null);
        }}
        onCancel={() => setConfirmStatus(null)}
        loading={setStatus.isPending}
      />
    </div>
  );
}
