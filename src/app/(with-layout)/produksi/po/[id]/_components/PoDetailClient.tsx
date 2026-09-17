"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePoDetail, usePoMutation } from "@/hooks/usePoProduksi";
import type { PoDetailData } from "@/services/po-produksi";
import { PO_STATUS_BADGE, PO_JENIS_LABEL, PO_PRIORITAS_LABEL } from "../../_components/po-status";
import { EstimasiSection } from "./EstimasiSection";
import { PageHeader } from "@/components/ui/PageHeader";

interface Props {
  poId: string;
  initialData: PoDetailData;
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

export function PoDetailClient({ poId, initialData }: Props) {
  const router = useRouter();
  const [, startNavigate] = useTransition();
  const [approveOpen, setApproveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data } = usePoDetail(poId);
  const { submit, approve, cancel, remove } = usePoMutation();

  const detail = data ?? initialData;
  const badge = PO_STATUS_BADGE[detail.status];
  const go = (path: string) => startNavigate(() => router.push(path));

  const totalTarget = detail.details.reduce((s, d) => s + d.jumlahTarget, 0);
  const totalRencana = detail.details.reduce(
    (s, d) => s + d.jumlahTarget + d.lebihanPcs,
    0,
  );

  const cancellable = ["draft", "menunggu_persetujuan", "disetujui", "menunggu_bahan"].includes(detail.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.nomorDokumen}
        breadcrumb={[
          { label: "Produksi" },
          { label: "PO Produksi", href: "/produksi/po" },
          { label: detail.nomorDokumen },
        ]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <InfoItem label="Produk" value={`${detail.produkKode} — ${detail.produkNama}`} />
          <InfoItem
            label="Status"
            value={
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", badge.className)}>
                {badge.label}
              </span>
            }
          />
          <InfoItem label="Jenis" value={PO_JENIS_LABEL[detail.jenis]} />
          <InfoItem label="Prioritas" value={PO_PRIORITAS_LABEL[detail.prioritas] ?? detail.prioritas} />
          <InfoItem label="Tanggal" value={fmtDate(detail.tanggal)} />
          <InfoItem label="Tanggal Mulai" value={fmtDate(detail.tanggalMulai)} />
          <InfoItem label="Target Selesai" value={fmtDate(detail.targetSelesai)} />
          <InfoItem label="Penanggung Jawab" value={detail.penanggungJawabNama} />
        </div>
        {detail.catatan && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{detail.catatan}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-stroke pt-4 dark:border-dark-3">
          {detail.status === "draft" && (
            <>
              <Button size="sm" onClick={() => submit.mutate(poId)} loading={submit.isPending}>
                Ajukan Persetujuan
              </Button>
              <Button size="sm" variant="outline" onClick={() => go(`/produksi/po/${poId}/edit`)}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDeleteOpen(true)} loading={remove.isPending}>
                Hapus
              </Button>
            </>
          )}
          {detail.status === "menunggu_persetujuan" && (
            <Button size="sm" onClick={() => setApproveOpen(true)} loading={approve.isPending}>
              Setujui
            </Button>
          )}
          {detail.status === "disetujui" && (
            <Button size="sm" onClick={() => go(`/produksi/permintaan-bahan/baru?po=${poId}`)}>
              Buat Permintaan Bahan
            </Button>
          )}
          {cancellable && (
            <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)} loading={cancel.isPending}>
              Batalkan PO
            </Button>
          )}
        </div>
      </div>

      {/* Target per SKU */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <h3 className="border-b border-stroke px-5 py-4 font-semibold text-dark dark:border-dark-3 dark:text-white">
          Target per SKU
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-dark-2 dark:text-gray-400">
                <th className="px-5 py-3 font-medium">No.</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Warna / Ukuran</th>
                <th className="px-5 py-3 font-medium text-right">Target</th>
                <th className="px-5 py-3 font-medium text-right">Lebihan</th>
                <th className="px-5 py-3 font-medium text-right">Rencana Cutting</th>
              </tr>
            </thead>
            <tbody>
              {detail.details.map((d, i) => (
                <tr key={d.id} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-dark dark:text-white">{d.sku}</td>
                  <td className="px-5 py-3 text-dark dark:text-white">{d.warnaNama} / {d.ukuran}</td>
                  <td className="px-5 py-3 text-right text-dark dark:text-white">{d.jumlahTarget} pcs</td>
                  <td className="px-5 py-3 text-right text-dark dark:text-white">{d.lebihanPcs} pcs</td>
                  <td className="px-5 py-3 text-right text-dark dark:text-white">
                    {d.jumlahTarget + d.lebihanPcs} pcs
                  </td>
                </tr>
              ))}
              <tr className="border-t border-stroke bg-gray-50 font-semibold dark:border-dark-3 dark:bg-dark-2">
                <td className="px-5 py-3" colSpan={3}>Total</td>
                <td className="px-5 py-3 text-right text-dark dark:text-white">{totalTarget} pcs</td>
                <td className="px-5 py-3" />
                <td className="px-5 py-3 text-right text-dark dark:text-white">{totalRencana} pcs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <EstimasiSection poId={poId} />

      <ConfirmDialog
        open={approveOpen}
        title="Setujui PO?"
        message="BOM aktif produk akan dikunci ke PO ini untuk estimasi bahan."
        confirmLabel="Setujui"
        onConfirm={() => {
          approve.mutate(poId);
          setApproveOpen(false);
        }}
        onCancel={() => setApproveOpen(false)}
        loading={approve.isPending}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Batalkan PO?"
        message="PO yang dibatalkan tidak bisa diaktifkan lagi."
        confirmLabel="Batalkan PO"
        onConfirm={() => {
          cancel.mutate(poId);
          setCancelOpen(false);
        }}
        onCancel={() => setCancelOpen(false)}
        loading={cancel.isPending}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Hapus PO?"
        message="PO draft ini akan dihapus."
        confirmLabel="Hapus"
        onConfirm={() => {
          remove.mutate(poId, { onSuccess: (res) => { if (!res.error) router.push("/produksi/po"); } });
          setDeleteOpen(false);
        }}
        onCancel={() => setDeleteOpen(false)}
        loading={remove.isPending}
      />
    </div>
  );
}
