import { notFound } from "next/navigation";
import { getBarangKeluarDetail } from "@/services/barang-keluar";
import { PageHeader } from "@/components/ui/PageHeader";

const rupiah = (n: number | string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n));

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(d));

export default async function BarangKeluarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getBarangKeluarDetail(id);
  if (res.error || !res.data) notFound();

  const { header, detail } = res.data;
  const total = detail.reduce((s, d) => s + Number(d.subtotal), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={header.nomorDokumen}
        breadcrumb={[
          { label: "Inventory", href: "/inventory/barang-keluar" },
          { label: "Barang Keluar", href: "/inventory/barang-keluar" },
          { label: header.nomorDokumen },
        ]}
      />

      {/* Header info */}
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-dark-5 dark:text-dark-6">Tanggal</dt>
            <dd className="font-medium text-dark dark:text-white">
              {fmtDate(header.tanggal)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-dark-5 dark:text-dark-6">Tujuan</dt>
            <dd className="font-medium text-dark dark:text-white">
              {header.tujuan || "-"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-dark-5 dark:text-dark-6">Catatan</dt>
            <dd className="font-medium text-dark dark:text-white">
              {header.catatan || "-"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Detail table */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-1 dark:bg-dark-2">
            <tr className="text-left text-dark dark:text-white">
              <th className="px-4 py-3 font-medium">Bahan</th>
              <th className="px-4 py-3 text-right font-medium">Kuantitas</th>
              <th className="px-4 py-3 text-right font-medium">Harga Rata²</th>
              <th className="px-4 py-3 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {detail.map((d) => (
              <tr
                key={d.id}
                className="border-t border-stroke dark:border-dark-3"
              >
                <td className="px-4 py-3 text-dark dark:text-white">
                  {d.bahanKode ? `${d.bahanKode} — ` : ""}
                  {d.bahanNama || "-"}
                </td>
                <td className="px-4 py-3 text-right text-dark dark:text-white">
                  {Number(d.kuantitas)}
                </td>
                <td className="px-4 py-3 text-right text-dark dark:text-white">
                  {rupiah(d.hargaSatuan)}
                </td>
                <td className="px-4 py-3 text-right text-dark dark:text-white">
                  {rupiah(d.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-stroke dark:border-dark-3">
              <td
                colSpan={3}
                className="px-4 py-3 text-right font-semibold text-dark dark:text-white"
              >
                Total Nilai Keluar
              </td>
              <td className="px-4 py-3 text-right font-bold text-dark dark:text-white">
                {rupiah(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
