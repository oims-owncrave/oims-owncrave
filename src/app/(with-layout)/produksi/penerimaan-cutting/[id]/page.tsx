import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { getPenerimaanDetail } from "@/services/penerimaan-cutting";
import { KONDISI_TERIMA } from "@/lib/schemas/penerimaan-cutting";
import { PageHeader } from "@/components/ui/PageHeader";

function fmtDate(d: Date | string | null) {
  return d
    ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : "—";
}

const fmtQty = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-dark dark:text-white">{value ?? "—"}</p>
    </div>
  );
}

export default async function PenerimaanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getPenerimaanDetail(id);
  if (!detail) notFound();

  const kondisiLabel = new Map(KONDISI_TERIMA.map((k) => [k.value as string, k.label]));

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.nomorDokumen}
        breadcrumb={[
          { label: "Produksi" },
          { label: "Penerimaan Cutting", href: "/produksi/penerimaan-cutting" },
          { label: detail.nomorDokumen },
        ]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <InfoItem label="PO" value={`${detail.poNomor} — ${detail.produkNama}`} />
          <InfoItem label="Barang Keluar" value={detail.bkNomor} />
          <InfoItem label="Tanggal Serah (gudang)" value={fmtDate(detail.tanggalSerah)} />
          <InfoItem label="Tanggal Terima" value={fmtDate(detail.tanggalTerima)} />
          <InfoItem label="Catatan" value={detail.catatan} />
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
                <th className="px-5 py-3 font-medium text-right">Menurut Gudang</th>
                <th className="px-5 py-3 font-medium text-right">Diterima</th>
                <th className="px-5 py-3 font-medium text-right">Selisih</th>
                <th className="px-5 py-3 font-medium">Kondisi</th>
                <th className="px-5 py-3 font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {detail.details.map((d) => {
                const selisih = Number(d.jumlahDiterima) - Number(d.jumlahGudang);
                return (
                  <tr key={d.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-5 py-3 text-dark dark:text-white">
                      {d.bahanKode} — {d.bahanNama}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {fmtQty(Number(d.jumlahGudang))} {d.satuanSingkatan}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {fmtQty(Number(d.jumlahDiterima))} {d.satuanSingkatan}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3 text-right font-medium",
                        selisih === 0
                          ? "text-green-700 dark:text-green-300"
                          : "text-yellow-700 dark:text-yellow-300",
                      )}
                    >
                      {selisih === 0 ? "—" : `${selisih > 0 ? "+" : ""}${fmtQty(selisih)} ${d.satuanSingkatan}`}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                          d.kondisi === "baik"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
                        )}
                      >
                        {kondisiLabel.get(d.kondisi) ?? d.kondisi}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{d.catatan ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
