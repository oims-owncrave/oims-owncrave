"use client";

import { cn } from "@/lib/utils";
import { useEstimasiBahan } from "@/hooks/usePoProduksi";
import { PeringatanVarian } from "../../_components/PeringatanVarian";

const STATUS_BADGE = {
  tersedia: {
    label: "Tersedia",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  sebagian: {
    label: "Sebagian",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  tidak_tersedia: {
    label: "Tidak Tersedia",
    className: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  },
} as const;

const fmtQty = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);

export function EstimasiSection({ poId }: { poId: string }) {
  const { data, isLoading } = useEstimasiBahan(poId);

  return (
    <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-stroke px-5 py-4 dark:border-dark-3">
        <h3 className="font-semibold text-dark dark:text-white">Estimasi Kebutuhan Bahan</h3>
        {data && !("error" in data) && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {data.bomNomor} · v{data.bomVersi}
          </span>
        )}
      </div>

      {isLoading && (
        <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">Menghitung…</p>
      )}

      {data && "error" in data && (
        <p className="px-5 py-4 text-sm text-yellow-700 dark:text-yellow-300">{data.error}</p>
      )}

      {data && !("error" in data) && (
        <div className="overflow-x-auto">
          <div className="px-5 pt-4">
            <PeringatanVarian labels={data.varianTanpaBahan} />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-dark-2 dark:text-gray-400">
                <th className="px-5 py-3 font-medium">Bahan</th>
                <th className="px-5 py-3 font-medium">Untuk</th>
                <th className="px-5 py-3 font-medium text-right">Kebutuhan Standar</th>
                <th className="px-5 py-3 font-medium text-right">Lebihan</th>
                <th className="px-5 py-3 font-medium text-right">Total Kebutuhan</th>
                <th className="px-5 py-3 font-medium text-right">Stok</th>
                <th className="px-5 py-3 font-medium text-right">Kekurangan</th>
                <th className="px-5 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const badge = STATUS_BADGE[r.status];
                return (
                  <tr key={r.bahanId} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-5 py-3 text-dark dark:text-white">
                      {r.bahanKode} — {r.bahanNama}{r.bahanUkuran ? ` · ${r.bahanUkuran}` : ""}
                    </td>
                    <td className="px-5 py-3 text-dark dark:text-white">
                      {r.untuk.length ? r.untuk.join(", ") : "Semua"}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {fmtQty(r.kebutuhanStandar)} {r.satuanSingkatan}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {r.lebihanBahan > 0 ? `${fmtQty(r.lebihanBahan)} ${r.satuanSingkatan}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-dark dark:text-white">
                      {fmtQty(r.totalKebutuhan)} {r.satuanSingkatan}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {fmtQty(r.stokTersedia)} {r.satuanSingkatan}
                    </td>
                    <td className="px-5 py-3 text-right text-dark dark:text-white">
                      {r.kekurangan > 0 ? `${fmtQty(r.kekurangan)} ${r.satuanSingkatan}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", badge.className)}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
