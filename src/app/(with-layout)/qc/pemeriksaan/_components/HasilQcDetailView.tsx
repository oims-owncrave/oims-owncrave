"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, formatTanggal } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Plus, Trash2 } from "lucide-react";
import { TemuanCacatModal } from "./TemuanCacatModal";
import {
  QC_TINGKAT_LABEL,
  QC_TINGKAT_CLASS,
  CACAT_SUMBER_LABEL,
} from "@/lib/qc/labels";
import { useTemuanCacatList, useTemuanCacatMutation } from "@/hooks/useTemuanCacat";
import type { getHasilQcDetail } from "@/services/hasil-qc";
import type { JenisCacat } from "@/db/schema";

type Data = NonNullable<Awaited<ReturnType<typeof getHasilQcDetail>>>;

interface Props {
  header: Data["header"];
  details: Data["details"];
  cacatOptions: JenisCacat[];
}

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  selesai: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  diverifikasi: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-dark dark:text-white">{value}</dd>
    </div>
  );
}

export function HasilQcDetailView({ header, details, cacatOptions }: Props) {
  const [modalFor, setModalFor] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();
  const { data: temuan } = useTemuanCacatList(header.id);
  const { remove } = useTemuanCacatMutation(header.id);

  // kolom "Cacat Dirinci" dihitung Server Component (props details), bukan query
  // client — tanpa refresh angkanya tertinggal sampai halaman dimuat ulang manual
  function segarkan() {
    router.refresh();
  }

  const terkunci = header.status === "diverifikasi";
  const rows = temuan ?? [];

  const totalDiperiksa = details.reduce((n, d) => n + d.jumlahDiperiksa, 0);
  const totalBermasalah = details.reduce((n, d) => n + Number(d.bermasalah), 0);
  const defectRate = totalDiperiksa > 0 ? (totalBermasalah / totalDiperiksa) * 100 : 0;

  // sisa bermasalah yang belum dirinci cacatnya, per baris
  const sisaFor = (detailId: string, bermasalah: number) =>
    bermasalah - rows.filter((t) => t.hasilQcDetailId === detailId).reduce((n, t) => n + t.jumlah, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={header.nomorDokumen}
        breadcrumb={[
          { label: "Quality Control" },
          { label: "Pemeriksaan QC", href: "/qc/pemeriksaan" },
          { label: header.nomorDokumen },
        ]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Field label="Tanggal" value={formatTanggal(header.tanggal)} />
          <Field label="Work Order" value={header.nomorWo} />
          <Field label="PO" value={header.nomorPo || "—"} />
          <Field label="Vendor" value={header.vendorNama || "Internal"} />
          <Field label="Petugas" value={header.petugasNama || "—"} />
          <Field
            label="Status"
            value={
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  STATUS_CLASS[header.status],
                )}
              >
                {header.status}
              </span>
            }
          />
          <Field label="Total Diperiksa" value={`${totalDiperiksa} pcs`} />
          <Field
            label="Defect Rate"
            value={
              <span
                className={cn(
                  "font-semibold",
                  defectRate >= 20
                    ? "text-red-600"
                    : defectRate >= 10
                      ? "text-amber-600"
                      : "text-green-600",
                )}
              >
                {defectRate.toFixed(1)}%
              </span>
            }
          />
          {header.verifiedAt && (
            <Field label="Diverifikasi" value={formatTanggal(header.verifiedAt, true)} />
          )}
        </dl>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h3 className="font-semibold text-dark dark:text-white">Hasil per Varian</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-2">
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Produk / SKU</th>
                <th className="px-4 py-3">Warna / Ukuran</th>
                <th className="px-4 py-3 text-right">Diperiksa</th>
                <th className="px-4 py-3 text-right">A</th>
                <th className="px-4 py-3 text-right">B</th>
                <th className="px-4 py-3 text-right">C</th>
                <th className="px-4 py-3 text-right">Perbaikan</th>
                <th className="px-4 py-3 text-right">Reject</th>
                <th className="px-4 py-3 text-right">Defect</th>
                <th className="px-4 py-3 text-right">Cacat Dirinci</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {details.map((d) => {
                const sisa = sisaFor(d.id, Number(d.bermasalah));
                return (
                  <tr key={d.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-4 py-3">
                      <div className="text-dark dark:text-white">{d.produkNama}</div>
                      <div className="text-xs text-gray-500">{d.sku}</div>
                    </td>
                    <td className="px-4 py-3">
                      {d.warnaNama} / {d.ukuran}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{d.jumlahDiperiksa}</td>
                    <td className="px-4 py-3 text-right">{d.gradeA}</td>
                    <td className="px-4 py-3 text-right">{d.gradeB}</td>
                    <td className="px-4 py-3 text-right">{d.gradeC}</td>
                    <td className="px-4 py-3 text-right">{d.perbaikan}</td>
                    <td className="px-4 py-3 text-right">{d.reject}</td>
                    <td className="px-4 py-3 text-right">{d.defectRate.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right">
                      {Number(d.jumlahTemuan)} / {Number(d.bermasalah)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setModalFor(d.id)}
                        disabled={terkunci || sisa <= 0}
                        className="h-8 px-2 text-xs"
                        title={
                          sisa <= 0 ? "Semua produk bermasalah sudah dirinci" : "Catat cacat"
                        }
                      >
                        <Plus size={14} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h3 className="font-semibold text-dark dark:text-white">
            Temuan Cacat ({rows.length})
          </h3>
        </div>

        {rows.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Belum ada temuan cacat dicatat. Tanpa rincian ini, defect rate cuma angka tanpa
            akar masalah.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-2">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Jenis Cacat</th>
                  <th className="px-4 py-3">Bagian</th>
                  <th className="px-4 py-3">Keparahan</th>
                  <th className="px-4 py-3">Sumber</th>
                  <th className="px-4 py-3 text-right">Jumlah</th>
                  <th className="px-4 py-3">Penyebab</th>
                  <th className="px-4 py-3">Foto</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-4 py-3">{t.sku}</td>
                    <td className="px-4 py-3">
                      {t.jenisCacatKode} — {t.jenisCacatNama}
                    </td>
                    <td className="px-4 py-3">{t.bagianProduk || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          QC_TINGKAT_CLASS[t.keparahan],
                        )}
                      >
                        {QC_TINGKAT_LABEL[t.keparahan]}
                      </span>
                    </td>
                    <td className="px-4 py-3">{CACAT_SUMBER_LABEL[t.sumber] ?? t.sumber}</td>
                    <td className="px-4 py-3 text-right font-medium">{t.jumlah}</td>
                    <td className="px-4 py-3">{t.penyebabAwal || "—"}</td>
                    <td className="px-4 py-3">
                      {t.fotoUrl ? (
                        <a
                          href={t.fotoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          Lihat
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setDeleteId(t.id)}
                        disabled={terkunci}
                        className="h-8 px-2 text-xs text-red-600"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TemuanCacatModal
        open={modalFor !== null}
        onClose={() => {
          setModalFor(null);
          segarkan();
        }}
        hasilQcId={header.id}
        hasilQcDetailId={modalFor}
        sisa={
          modalFor
            ? sisaFor(modalFor, Number(details.find((d) => d.id === modalFor)?.bermasalah ?? 0))
            : 0
        }
        cacatOptions={cacatOptions}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Temuan Cacat?"
        message="Rincian cacat ini akan dihapus permanen."
        confirmLabel="Hapus"
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId, { onSuccess: segarkan });
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        loading={remove.isPending}
      />
    </div>
  );
}
