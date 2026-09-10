"use client";

import { cn, formatTanggal } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import type { getWoQcDetail } from "@/services/wo-qc";

type Data = NonNullable<Awaited<ReturnType<typeof getWoQcDetail>>>;

interface Props {
  header: Data["header"];
  details: Data["details"];
}

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  berjalan: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  selesai: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  dibatalkan: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-dark dark:text-white">{value}</dd>
    </div>
  );
}

export function WoQcDetailView({ header, details }: Props) {
  const totalPcs = details.reduce((n, d) => n + d.jumlahPcs, 0);
  const totalDiperiksa = details.reduce((n, d) => n + Number(d.sudahDiperiksa), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={header.nomorDokumen}
        breadcrumb={[
          { label: "Quality Control" },
          { label: "Work Order QC", href: "/qc/wo" },
          { label: header.nomorDokumen },
        ]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Field label="Tanggal" value={formatTanggal(header.tanggal)} />
          <Field label="Target Selesai" value={formatTanggal(header.targetSelesai)} />
          <Field label="PO" value={header.nomorPo || "—"} />
          <Field label="PIC" value={header.picNama || "—"} />
          <Field
            label="Metode"
            value={header.metode === "sampling" ? "Sampling" : "Pemeriksaan 100%"}
          />
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
          <Field
            label="Standar QC (snapshot)"
            value={
              header.standarNomor
                ? `${header.standarNomor} — ${header.standarNama} (v${header.standarVersi})`
                : "—"
            }
          />
          <Field label="Progres" value={`${totalDiperiksa} / ${totalPcs} pcs`} />
          {header.metode === "sampling" && (
            <Field
              label="Sampling"
              value={`sampel ${header.jumlahSampel} dari ${header.populasi} · terima ≤${header.batasDiterima} · tolak ≥${header.batasDitolak}`}
            />
          )}
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
            Baris Pemeriksaan ({details.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-2">
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">IN-QC</th>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Warna / Ukuran</th>
                <th className="px-4 py-3 text-right">Pcs</th>
                <th className="px-4 py-3 text-right">Diperiksa</th>
                <th className="px-4 py-3 text-right">Belum</th>
              </tr>
            </thead>
            <tbody>
              {details.map((d) => (
                <tr key={d.id} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-4 py-3">{d.nomorInQc}</td>
                  <td className="px-4 py-3">{d.produkNama}</td>
                  <td className="px-4 py-3">{d.sku}</td>
                  <td className="px-4 py-3">
                    {d.warnaNama} / {d.ukuran}
                  </td>
                  <td className="px-4 py-3 text-right">{d.jumlahPcs}</td>
                  <td className="px-4 py-3 text-right">{Number(d.sudahDiperiksa)}</td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-medium",
                      d.belumDiperiksa > 0 ? "text-amber-600" : "text-green-600",
                    )}
                  >
                    {d.belumDiperiksa}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
