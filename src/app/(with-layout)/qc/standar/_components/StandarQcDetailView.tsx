"use client";

import { cn, formatTanggal } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { QC_TINGKAT_LABEL, QC_TINGKAT_CLASS } from "@/lib/qc/labels";
import type { getStandarQcDetail } from "@/services/standar-qc";

type Data = NonNullable<Awaited<ReturnType<typeof getStandarQcDetail>>>;

interface Props {
  header: Data["header"];
  details: Data["details"];
}

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  aktif: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  nonaktif: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-dark dark:text-white">{value}</dd>
    </div>
  );
}

export function StandarQcDetailView({ header, details }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={header.nomorDokumen}
        breadcrumb={[
          { label: "Master" },
          { label: "Standar QC", href: "/master/data-qc?tab=standar" },
          { label: header.nomorDokumen },
        ]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Field label="Nama Standar" value={header.nama} />
          <Field label="Produk" value={header.produkNama || "— semua produk —"} />
          <Field label="Kategori" value={header.kategoriNama || "—"} />
          <Field label="Versi" value={`v${header.versi}`} />
          <Field label="Berlaku" value={formatTanggal(header.tanggalBerlaku)} />
          <Field
            label="Status"
            value={
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  STATUS_CLASS[header.status],
                )}
              >
                {header.status === "aktif"
                  ? "Aktif"
                  : header.status === "draft"
                    ? "Draft"
                    : "Nonaktif"}
              </span>
            }
          />
          {header.catatan && (
            <div className="sm:col-span-3">
              <Field label="Catatan" value={header.catatan} />
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h3 className="font-semibold text-dark dark:text-white">
            Kriteria Pemeriksaan ({details.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-2">
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Tahap</th>
                <th className="px-4 py-3">Bagian</th>
                <th className="px-4 py-3">Kriteria</th>
                <th className="px-4 py-3">Metode</th>
                <th className="px-4 py-3">Tingkat</th>
                <th className="px-4 py-3">Toleransi</th>
                <th className="px-4 py-3">Jenis Cacat</th>
                <th className="px-4 py-3">Foto</th>
              </tr>
            </thead>
            <tbody>
              {details.map((d, i) => (
                <tr key={d.id} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">{d.tahap}</td>
                  <td className="px-4 py-3">{d.bagianProdukNama || "—"}</td>
                  <td className="px-4 py-3">{d.kriteria}</td>
                  <td className="px-4 py-3">{d.metode || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        QC_TINGKAT_CLASS[d.tingkatKepentingan],
                      )}
                    >
                      {QC_TINGKAT_LABEL[d.tingkatKepentingan]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{d.toleransi || "—"}</td>
                  <td className="px-4 py-3">{d.jenisCacatNama || "—"}</td>
                  <td className="px-4 py-3">{d.wajibFoto ? "Wajib" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
